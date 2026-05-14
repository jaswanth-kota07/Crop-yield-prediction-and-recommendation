"""
Retrain crop model with the currently installed scikit-learn version.
This fixes the 'monotonic_cst' AttributeError caused by sklearn version mismatch.
"""
import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'Crop_recommendation.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
ENCODERS_DIR = os.path.join(MODELS_DIR, 'label_encoders')

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(ENCODERS_DIR, exist_ok=True)

print("Loading data...")
df = pd.read_csv(DATA_PATH)
print(f"  Loaded {len(df)} rows, columns: {list(df.columns)}")

# Standardise column names
df.columns = [c.strip().lower() for c in df.columns]
print(f"  Columns after normalise: {list(df.columns)}")

# Features and target
feature_cols = ['n', 'p', 'k', 'temperature', 'humidity', 'ph', 'rainfall']
target_col = 'label'

X = df[feature_cols].values
y_raw = df[target_col].values

# Encode labels
le = LabelEncoder()
y = le.fit_transform(y_raw)
print(f"  Classes: {list(le.classes_)}")

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)

# Train model
print("Training RandomForestClassifier...")
model = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"  Test Accuracy: {acc:.4f} ({acc*100:.2f}%)")

# Save model artifacts
print("Saving model artifacts...")

# 1. Crop model
model_path = os.path.join(MODELS_DIR, 'crop_model_v1.pkl')
joblib.dump(model, model_path)
print(f"  Saved: {model_path}")

# 2. Label encoder (both paths predict.py searches)
encoder_path1 = os.path.join(ENCODERS_DIR, 'crop_encoder.pkl')
joblib.dump(le, encoder_path1)
print(f"  Saved: {encoder_path1}")

crop_label_encoder_path = os.path.join(MODELS_DIR, 'crop_label_encoder_v1.pkl')
joblib.dump(le, crop_label_encoder_path)
print(f"  Saved: {crop_label_encoder_path}")

# 3. Scaler
scaler_path = os.path.join(MODELS_DIR, 'scaler_v1.pkl')
joblib.dump(scaler, scaler_path)
print(f"  Saved: {scaler_path}")

# Quick sanity check using raw (unscaled) values from demo data
print("\nSanity check with demo values (N=50, P=40, K=30, temp=28, hum=75, ph=6.5, rain=150):")
sample = np.array([[50, 40, 30, 28, 75, 6.5, 150]])
sample_scaled = scaler.transform(sample)
pred_class = model.predict(sample_scaled)[0]
pred_crop = le.inverse_transform([pred_class])[0]
proba = model.predict_proba(sample_scaled)[0]
confidence = proba[pred_class]
print(f"  => {pred_crop} (confidence: {confidence:.3f})")

print("\nSanity check with high-N values (N=90, P=42, K=43, temp=20, hum=82, ph=6.5, rain=200):")
sample2 = np.array([[90, 42, 43, 20, 82, 6.5, 200]])
sample2_scaled = scaler.transform(sample2)
pred_class2 = model.predict(sample2_scaled)[0]
pred_crop2 = le.inverse_transform([pred_class2])[0]
print(f"  => {pred_crop2}")

print("\nAll done! Restart uvicorn to pick up the new models.")
