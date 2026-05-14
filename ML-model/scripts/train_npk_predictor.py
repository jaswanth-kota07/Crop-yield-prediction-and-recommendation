import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

# Approximate coordinates for Indian states (latitude, longitude)
state_coordinates = {
    'Andhra Pradesh': (15.9129, 79.7400),
    'Arunachal Pradesh': (28.2180, 94.7278),
    'Assam': (26.2006, 92.9376),
    'Bihar': (25.0961, 85.3131),
    'Chhattisgarh': (21.2787, 81.8661),
    'Goa': (15.2993, 74.1240),
    'Gujarat': (22.2587, 71.1924),
    'Haryana': (29.0588, 76.0856),
    'Himachal Pradesh': (31.1048, 77.1734),
    'Jharkhand': (23.6102, 85.2799),
    'Karnataka': (15.3173, 75.7139),
    'Kerala': (10.8505, 76.2711),
    'Madhya Pradesh': (22.9734, 78.6569),
    'Maharashtra': (19.7515, 75.7139),
    'Manipur': (24.6637, 93.9063),
    'Meghalaya': (25.4670, 91.3662),
    'Mizoram': (23.1645, 92.9376),
    'Nagaland': (26.1584, 94.5624),
    'Odisha': (20.9517, 85.0985),
    'Punjab': (31.1471, 75.3412),
    'Rajasthan': (27.0238, 74.2179),
    'Sikkim': (27.5330, 88.5122),
    'Tamil Nadu': (11.1271, 78.6569),
    'Telangana': (18.1124, 79.0193),
    'Tripura': (23.9408, 91.9882),
    'Uttar Pradesh': (26.8467, 80.9462),
    'Uttarakhand': (30.0668, 79.0193),
    'West Bengal': (22.9868, 87.8550),
    'Delhi': (28.7041, 77.1025),
    'Jammu and Kashmir': (33.7782, 76.5762),
    'Ladakh': (34.1526, 77.5771),
    'Puducherry': (11.9416, 79.8083),
    'Chandigarh': (30.7333, 76.7794),
    'Andaman and Nicobar Islands': (11.7401, 92.6586),
    'Dadra and Nagar Haveli and Daman and Diu': (20.3974, 72.8328),
    'Lakshadweep': (10.5667, 72.6417)
}

def add_coordinates_to_dataset():
    """Add latitude and longitude columns to the dataset based on State"""

    # Load the dataset
    df = pd.read_csv('../datasets/all_india_crop_dataset_59crops.csv')

    # Add coordinates
    df['latitude'] = df['State'].map(lambda x: state_coordinates.get(x, (20.5937, 78.9629))[0])  # Default to India center
    df['longitude'] = df['State'].map(lambda x: state_coordinates.get(x, (20.5937, 78.9629))[1])

    # Add some random variation to simulate district-level differences
    np.random.seed(42)
    df['latitude'] += np.random.normal(0, 0.5, len(df))
    df['longitude'] += np.random.normal(0, 0.5, len(df))

    # Ensure coordinates are within reasonable bounds
    df['latitude'] = df['latitude'].clip(8, 37)  # India lat range
    df['longitude'] = df['longitude'].clip(68, 97)  # India lon range

    return df

def train_npk_model(df):
    """Train a model to predict NPK from latitude and longitude"""

    # Features: latitude, longitude
    X = df[['latitude', 'longitude']]

    # Targets: N, P, K
    y_n = df['Nitrogen_kg_ha']
    y_p = df['Phosphorus_kg_ha']
    y_k = df['Potassium_kg_ha']

    # Split data
    X_train, X_test, y_n_train, y_n_test = train_test_split(X, y_n, test_size=0.2, random_state=42)
    _, _, y_p_train, y_p_test = train_test_split(X, y_p, test_size=0.2, random_state=42)
    _, _, y_k_train, y_k_test = train_test_split(X, y_k, test_size=0.2, random_state=42)

    # Train models
    models = {}

    for y_train, y_test, name in [
        (y_n_train, y_n_test, 'N'),
        (y_p_train, y_p_test, 'P'),
        (y_k_train, y_k_test, 'K')
    ]:
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        print(f"{name} Model - MSE: {mse:.2f}, R²: {r2:.2f}")

        models[name] = model

    return models

def save_models(models):
    """Save trained models"""
    os.makedirs('models', exist_ok=True)

    for nutrient, model in models.items():
        joblib.dump(model, f'models/npk_{nutrient.lower()}_predictor.pkl')

    print("Models saved successfully!")

def predict_npk(latitude, longitude):
    """Predict NPK values for given coordinates"""
    models = {}
    for nutrient in ['n', 'p', 'k']:
        try:
            models[nutrient] = joblib.load(f'ML-model/models/npk_{nutrient}_predictor.pkl')
        except:
            print(f"Model for {nutrient} not found. Using default values.")
            return {'N': 50, 'P': 40, 'K': 30}

    # Make predictions
    input_data = pd.DataFrame([[latitude, longitude]], columns=['latitude', 'longitude'])

    predictions = {}
    for nutrient, model in models.items():
        pred = model.predict(input_data)[0]
        predictions[nutrient.upper()] = max(0, pred)  # Ensure non-negative

    return predictions

if __name__ == "__main__":
    # Process dataset
    print("Adding coordinates to dataset...")
    df = add_coordinates_to_dataset()

    # Save enhanced dataset
    df.to_csv('../datasets/all_india_crop_dataset_with_coords.csv', index=False)
    print("Enhanced dataset saved!")

    # Train models
    print("Training NPK prediction models...")
    models = train_npk_model(df)

    # Save models
    save_models(models)

    # Test prediction
    print("Testing prediction for Mumbai coordinates (19.0760, 72.8777)...")
    test_pred = predict_npk(19.0760, 72.8777)
    print(f"Predicted NPK: {test_pred}")