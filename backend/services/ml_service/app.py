import os
from datetime import datetime
from typing import List, Optional, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import lightgbm as lgb
import torch
import torch.nn as nn
from torch import Tensor
from sklearn.ensemble import IsolationForest
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from huggingface_hub import InferenceClient
import numpy as np
import joblib

app = FastAPI(title="ML/RISK Microservice")

from dotenv import load_dotenv
load_dotenv()  # Add at the top of app.py and train/*.py

MODELS_PATH = os.environ.get("MODELS_PATH", "models/")
HF_KEY = os.environ.get("HF_INFERENCE_API_KEY")
MODEL_VERSION = "v1.0"  # Update as needed

# Model holders
models = {
    "tabular": None,  # LightGBM
    "embedder": None,  # SentenceTransformer
    "summarizer": None,  # BART or InferenceClient
    "lstm": None,  # PyTorch LSTM
    "isolation_forest": None,  # For anomaly
}

class LSTM(nn.Module):
    def __init__(self, input_size=2, hidden_size=64, num_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, input_size)  # Predict next point

    def forward(self, x: Tensor) -> Tensor:
        _, (hn, _) = self.lstm(x)
        return self.fc(hn[-1])

def load_models():
    global models
    # Tabular (LightGBM)
    try:
        models["tabular"] = lgb.Booster(model_file=os.path.join(MODELS_PATH, "tabular.model"))
    except:
        pass

    # Embedder
    try:
        models["embedder"] = SentenceTransformer(os.path.join(MODELS_PATH, "embeddings"))
    except:
        pass

    # Summarizer (local BART first, fallback to HF Inference)
    try:
        models["summarizer"] = pipeline("summarization", model=os.path.join(MODELS_PATH, "bart"), device=0 if torch.cuda.is_available() else -1)
    except:
        if HF_KEY:
            models["summarizer"] = InferenceClient(token=HF_KEY)
        else:
            pass

    # LSTM
    try:
        lstm_path = os.path.join(MODELS_PATH, "lstm.pth")
        models["lstm"] = LSTM()
        models["lstm"].load_state_dict(torch.load(lstm_path, map_location="cpu"))
        models["lstm"].eval()
    except:
        pass

    # IsolationForest
    try:
        models["isolation_forest"] = joblib.load(os.path.join(MODELS_PATH, "isolation_forest.joblib"))
    except:
        pass

@app.on_event("startup")
async def startup_event():
    load_models()

# Input/Output Models
class ZoneScoreInput(BaseModel):
    polygon_id: str
    polygon_geojson: Dict  # GeoJSON dict
    recent_incident_counts: int
    crowd_density: float
    police_activity_score: float
    weather_flags: List[str]
    social_sentiment_score: float

class ZoneScoreOutput(BaseModel):
    polygon_id: str
    zone_risk_score: float
    risk_label: str
    reasons: List[str]
    model_version: str
    generated_at: str

class IndividualScoreInput(BaseModel):
    digital_id: Optional[str] = None
    tourist_id: Optional[str] = None
    features: Dict  # {age_group: str, solo_travel_bool: bool, health_flags: List[str], last_checkins: List[Dict], itinerary_features: Dict, recent_incident_counts: int}

class IndividualScoreOutput(BaseModel):
    digital_id: str
    risk_score: float
    risk_label: str
    reasons: List[str]
    model_version: str
    generated_at: str

class AnomalyInput(BaseModel):
    digital_id: str
    trajectory_points: List[Dict]  # [{lat: float, lng: float, timestamp: str}]

class AnomalyOutput(BaseModel):
    anomaly: bool
    type: Optional[str]
    confidence: float
    evidence_points: List[Dict]

class SummarizeInput(BaseModel):
    text_or_transcript: str

class SummarizeOutput(BaseModel):
    summary: str
    severity_suggested: str  # low/medium/high
    suggested_tags: List[str]

class IngestFeatureInput(BaseModel):
    digital_id: str
    features: Dict  # Arbitrary features for batch updates (log/print for now)

# Helper: Rule-based fallback for scoring
def rule_based_score(features: np.ndarray) -> float:
    # Dummy: average normalized values
    return np.mean(features / np.array([10, 1, 1, 1, 1]))  # Normalize roughly

def get_reasons(features: Dict, score: float) -> List[str]:
    reasons = []
    if features.get("recent_incident_counts", 0) > 5:
        reasons.append("High recent incident counts")
    if features.get("crowd_density", 0) > 0.8:
        reasons.append("High crowd density")
    if features.get("police_activity_score", 0) < 0.2:
        reasons.append("Low police presence")
    if "rain" in features.get("weather_flags", []):
        reasons.append("Adverse weather (rain)")
    if features.get("social_sentiment_score", 0) < 0.5:
        reasons.append("Negative social sentiment")
    return reasons

def get_risk_label(score: float) -> str:
    if score < 0.3:
        return "low"
    elif score < 0.7:
        return "medium"
    else:
        return "high"

# Endpoints
@app.post("/ml/zone_score", response_model=ZoneScoreOutput)
async def zone_score(input: ZoneScoreInput):
    features = np.array([
        input.recent_incident_counts,
        input.crowd_density,
        input.police_activity_score,
        len(input.weather_flags),  # Simple count
        input.social_sentiment_score
    ]).reshape(1, -1)

    if models["tabular"]:
        score = models["tabular"].predict(features)[0]
    else:
        score = rule_based_score(features)

    score = min(max(score, 0.0), 1.0)
    reasons = get_reasons(input.dict(), score)
    generated_at = datetime.utcnow().isoformat()

    return ZoneScoreOutput(
        polygon_id=input.polygon_id,
        zone_risk_score=score,
        risk_label=get_risk_label(score),
        reasons=reasons,
        model_version=MODEL_VERSION,
        generated_at=generated_at
    )

@app.post("/ml/individual_score", response_model=IndividualScoreOutput)
async def individual_score(input: IndividualScoreInput):
    if not input.digital_id and not input.tourist_id:
        raise HTTPException(400, "digital_id or tourist_id required")

    feats = input.features
    features = np.array([
        {"young": 0, "adult": 0.5, "senior": 1}.get(feats.get("age_group", "adult"), 0.5),
        1 if feats.get("solo_travel_bool", False) else 0,
        len(feats.get("health_flags", [])),
        len(feats.get("last_checkins", [])),
        feats.get("recent_incident_counts", 0)
    ]).reshape(1, -1)  # Simplified feature engineering

    if models["tabular"]:
        score = models["tabular"].predict(features)[0]
    else:
        score = rule_based_score(features)

    score = min(max(score, 0.0), 1.0)
    reasons = get_reasons(feats, score)  # Reuse, adapt if needed
    generated_at = datetime.utcnow().isoformat()
    digital_id = input.digital_id or input.tourist_id

    return IndividualScoreOutput(
        digital_id=digital_id,
        risk_score=score,
        risk_label=get_risk_label(score),
        reasons=reasons,
        model_version=MODEL_VERSION,
        generated_at=generated_at
    )

@app.post("/ml/anomaly", response_model=AnomalyOutput)
async def anomaly_detection(input: AnomalyInput):
    points = input.trajectory_points
    if len(points) < 3:
        raise HTTPException(400, "At least 3 points required")

    # Engineer sequence: [delta_lat, delta_lng] differences
    seq = []
    for i in range(1, len(points)):
        dl = points[i]["lat"] - points[i-1]["lat"]
        dn = points[i]["lng"] - points[i-1]["lng"]
        seq.append([dl, dn])
    seq = np.array(seq)

    # Embed with LSTM if available
    if models["lstm"]:
        seq_tensor = torch.tensor(seq).float().unsqueeze(0)  # batch=1
        with torch.no_grad():
            embedding = models["lstm"](seq_tensor).numpy()
    else:
        embedding = seq.mean(axis=0).reshape(1, -1)  # Fallback mean

    if models["isolation_forest"]:
        pred = models["isolation_forest"].predict(embedding)
        anomaly_flag = pred[0] == -1
        confidence = abs(models["isolation_forest"].score_samples(embedding)[0])
    else:
        # Fallback: simple deviation check
        devs = np.std(seq, axis=0)
        anomaly_flag = any(dev > 0.1 for dev in devs)  # Arbitrary threshold
        confidence = np.mean(devs)

    return AnomalyOutput(
        anomaly=anomaly_flag,
        type="trajectory_deviation" if anomaly_flag else None,
        confidence=confidence,
        evidence_points=points[-3:] if anomaly_flag else []
    )

@app.post("/ml/summarize_incident", response_model=SummarizeOutput)
async def summarize_incident(input: SummarizeInput):
    text = input.text_or_transcript
    if not text:
        raise HTTPException(400, "Text required")

    if models["summarizer"]:
        if isinstance(models["summarizer"], InferenceClient):
            summary = models["summarizer"].summarization(text, max_length=130, min_length=30)
        else:
            summary = models["summarizer"](text, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]
    else:
        summary = text[:100] + "..."  # Fallback truncate

    # Heuristic severity and tags
    severity = "high" if "emergency" in text.lower() else "medium" if "incident" in text.lower() else "low"
    tags = ["incident"]  # Extend with keyword extraction if needed

    return SummarizeOutput(
        summary=summary,
        severity_suggested=severity,
        suggested_tags=tags
    )

@app.post("/ml/ingest_feature")
async def ingest_feature(input: IngestFeatureInput):
    # For batch updates: log or save to file/DB (dummy for now)
    print(f"Ingested features for {input.digital_id}: {input.features}")
    return {"status": "ingested"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("SERVICE_PORT", 8004))
    uvicorn.run(app, host="0.0.0.0", port=port)