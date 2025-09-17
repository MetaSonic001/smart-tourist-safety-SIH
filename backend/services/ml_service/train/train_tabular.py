import os
import numpy as np
import pandas as pd
import lightgbm as lgb

MODELS_PATH = os.environ.get("MODELS_PATH", "../models/")

# Dummy dataset (replace with real CSV or DB query)
data = {
    "recent_incident_counts": [0, 5, 10, 2, 8],
    "crowd_density": [0.1, 0.5, 0.9, 0.3, 0.7],
    "police_activity_score": [0.8, 0.4, 0.1, 0.6, 0.2],
    "weather_flags_count": [0, 1, 2, 0, 1],
    "social_sentiment_score": [0.9, 0.6, 0.3, 0.8, 0.4],
    "risk_score": [0.1, 0.5, 0.9, 0.3, 0.7]  # Labels
}
df = pd.DataFrame(data)

X = df.drop("risk_score", axis=1)
y = df["risk_score"]

params = {"objective": "regression", "metric": "rmse", "verbose": -1}
train_set = lgb.Dataset(X, y)
model = lgb.train(params, train_set, num_boost_round=100)

model.save_model(os.path.join(MODELS_PATH, "tabular.model"))
print("Tabular model trained and saved.")