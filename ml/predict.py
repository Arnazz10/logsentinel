import joblib
import pandas as pd
import sys
import json
from pathlib import Path

# Paths
MODELS_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODELS_DIR / "isolation_forest.joblib"
SCALER_PATH = MODELS_DIR / "scaler.joblib"

FEATURE_COLUMNS = [
    "hour_of_day",
    "response_time_ms",
    "error_code",
    "log_level_encoded",
    "request_count_last_60s",
    "service_id_encoded",
]

def predict(data):
    # Load model and scaler
    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        print("Error: Model or scaler not found. Please run 'make train' first.")
        return

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    # Convert to DataFrame
    df = pd.DataFrame([data], columns=FEATURE_COLUMNS)
    
    # Scale features
    X_scaled = scaler.transform(df)
    
    # Predict
    # Isolation Forest returns -1 for anomalies and 1 for normal
    prediction = model.predict(X_scaled)[0]
    score = model.decision_function(X_scaled)[0]
    
    status = "ANOMALY" if prediction == -1 else "NORMAL"
    
    return {
        "status": status,
        "score": float(score),
        "prediction_raw": int(prediction)
    }

if __name__ == "__main__":
    # Example input: [hour, response_time, error_code, log_level, req_count, service_id]
    if len(sys.argv) > 1:
        try:
            input_data = [float(x) for x in sys.argv[1:]]
            if len(input_data) != len(FEATURE_COLUMNS):
                print(f"Error: Expected {len(FEATURE_COLUMNS)} values, got {len(input_data)}")
                sys.exit(1)
            
            result = predict(input_data)
            print(json.dumps(result, indent=2))
        except ValueError:
            print("Error: All inputs must be numeric.")
    else:
        print("Usage: python ml/predict.py <hour_of_day> <response_time_ms> <error_code> <log_level_encoded> <request_count_last_60s> <service_id_encoded>")
        print("\nExample (Normal): python ml/predict.py 14 120 0 1 45 2")
        print("Example (Anomaly): python ml/predict.py 3 8500 500 4 1200 1")
