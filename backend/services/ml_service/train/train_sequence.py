import os
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.ensemble import IsolationForest
import numpy as np
import joblib

from app import LSTM  # Import from app (or duplicate class)

MODELS_PATH = os.environ.get("MODELS_PATH", "../models/")

# Dummy sequences (N sequences, each M points, 2 features: delta_lat, delta_lng)
normal_sequences = np.random.normal(0, 0.01, size=(100, 10, 2))  # Normal low variance

lstm = LSTM()
optimizer = optim.Adam(lstm.parameters(), lr=0.001)
criterion = nn.MSELoss()

# Train LSTM on forecasting
for epoch in range(10):
    for seq in normal_sequences:
        input_seq = torch.tensor(seq[:-1]).float().unsqueeze(0)
        target = torch.tensor(seq[-1]).float().unsqueeze(0)
        output = lstm(input_seq)
        loss = criterion(output, target)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

torch.save(lstm.state_dict(), os.path.join(MODELS_PATH, "lstm.pth"))

# Get embeddings for normal data
embeddings = []
with torch.no_grad():
    for seq in normal_sequences:
        seq_tensor = torch.tensor(seq).float().unsqueeze(0)
        emb = lstm(seq_tensor).numpy()
        embeddings.append(emb.flatten())
embeddings = np.array(embeddings)

# Fit IsolationForest on normal embeddings
iso_forest = IsolationForest(contamination=0.1)
iso_forest.fit(embeddings)

joblib.dump(iso_forest, os.path.join(MODELS_PATH, "isolation_forest.joblib"))
print("Sequence models trained and saved.")