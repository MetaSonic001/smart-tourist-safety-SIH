# ML/RISK Microservice

FastAPI-based service for risk scoring and incident summarization.

## Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Download HF models (requires `huggingface-cli` from `pip install huggingface-hub`):
   - `huggingface-cli download sentence-transformers/all-mpnet-base-v2 --local-dir models/embeddings`
   - `huggingface-cli download facebook/bart-large-cnn --local-dir models/bart`
   - (Optional) `huggingface-cli download openai/whisper-small --local-dir models/whisper` (not used in endpoints yet)
3. Train models (dummy data; replace with real):
   - `python train/train_tabular.py`
   - `python train/train_sequence.py`
4. Set env vars:
   - `export MODELS_PATH=models/`
   - `export HF_INFERENCE_API_KEY=your_hf_token` (for fallback)
   - `export SERVICE_PORT=8004`
   - (Optional) `export REDIS_URL=redis://localhost:6379` (not used yet)
   - (Optional) `export DATABASE_URL=...` (for training data pull)
5. Run: `python app.py` or `uvicorn app:app --host 0.0.0.0 --port 8004`

## Testing
`pytest tests/`

## Notes
- Models load from disk; fallbacks if missing.
- Extend training with real data (e.g., pull from DATABASE_URL).
- For production, add auth, logging, and Redis subscription if needed.
- GPU: Auto-detected for torch/transformers.