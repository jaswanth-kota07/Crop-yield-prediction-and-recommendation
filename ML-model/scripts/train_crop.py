"""
Fixed Crop recommendation model training module
"""

import pandas as pd
import numpy as np
import os
import json
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

def load_processed_data():
    """
    Load the preprocessed data for training
    """
    processed_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'processed')
    processed_file = os.path.join(processed_dir, 'crop_data_cleaned.csv')
    
    if not os.path.exists(processed_file):
        raise FileNotFoundError(f"Processed data not found at {processed_file}. Run preprocess.py first.")
    
    df = pd.read_csv(processed_file)
    print(f"📊 Loaded processed data: {df.shape}")
    return df

def prepare_training_data(df):
    """
    Prepare features and target for training - SIMPLIFIED VERSION
    """
    # Use only basic features to avoid issues
    basic_features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    
    # Check which features actually exist in the data
    available_features = [f for f in basic_features if f in df.columns]
    print(f"🔍 Available features: {available_features}")
    
    # Check target column
    if 'label_encoded' in df.columns:
        target_col = 'label_encoded'
        print("✅ Using encoded labels")
    elif 'label' in df.columns:
        from sklearn.preprocessing import LabelEncoder
        label_encoder = LabelEncoder()
        df['label_encoded'] = label_encoder.fit_transform(df['label'])
        target_col = 'label_encoded'
        class_names = label_encoder.classes_
        
        # Save the encoder
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        os.makedirs(os.path.join(models_dir, 'label_encoders'), exist_ok=True)
        joblib.dump(label_encoder, os.path.join(models_dir, 'label_encoders', 'crop_encoder.pkl'))
        print("✅ Saved crop label encoder")
    else:
        raise ValueError("No target column found in processed data")
    
    # Handle missing values in features
    for feature in available_features:
        if df[feature].isnull().any():
            df[feature] = df[feature].fillna(df[feature].median())
            print(f"⚠️  Filled missing values in {feature}")
    
    # Prepare features and target
    X = df[available_features]
    y = df[target_col]
    
    print(f"🎯 Target classes: {len(np.unique(y))}")
    print(f"📈 Features: {available_features}")
    print(f"📊 Data shape: X{X.shape}, y{y.shape}")
    
    return X, y, available_features, np.unique(y)

def train_crop_model(X, y, feature_cols, class_names):
    """
    Train the crop recommendation model using Random Forest (more stable)
    """
    print("\n🌱 Training Crop Recommendation Model...")
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {X_train.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    
    # Use Random Forest instead of LightGBM for stability
    print("🤖 Using Random Forest Classifier (more stable)...")
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    
    # Train the model
    print("⏳ Training model...")
    model.fit(X_train, y_train)
    
    # Evaluate on training set
    y_train_pred = model.predict(X_train)
    train_accuracy = accuracy_score(y_train, y_train_pred)
    
    # Evaluate on test set
    y_test_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    
    print(f"\n📊 Model Performance:")
    print(f"  Training Accuracy: {train_accuracy:.4f}")
    print(f"  Test Accuracy: {test_accuracy:.4f}")
    
    # Simple cross-validation without early stopping issues
    print("⏳ Performing simple cross-validation...")
    try:
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X, y, cv=skf, scoring='accuracy')
        print(f"  Cross-validation Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        cv_metrics = {
            'mean': cv_scores.mean(),
            'std': cv_scores.std(),
            'scores': cv_scores.tolist()
        }
    except Exception as e:
        print(f"⚠️  Cross-validation failed: {e}")
        cv_metrics = {'mean': test_accuracy, 'std': 0.0, 'scores': [test_accuracy]}
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\n🔍 Feature Importance:")
    for _, row in feature_importance.iterrows():
        print(f"  {row['feature']}: {row['importance']:.4f}")
    
    # Show top 3 predictions for sample input
    print(f"\n🧪 Sample Prediction Test:")
    sample_idx = 0
    sample_input = X_test.iloc[sample_idx:sample_idx+1]
    sample_actual = y_test.iloc[sample_idx]
    
    probabilities = model.predict_proba(sample_input)[0]
    top_3_indices = np.argsort(probabilities)[-3:][::-1]
    
    print(f"  Actual: Class {sample_actual}")
    for i, idx in enumerate(top_3_indices):
        print(f"  Top {i+1}: Class {idx} (prob: {probabilities[idx]:.3f})")
    
    metrics = {
        'train_accuracy': float(train_accuracy),
        'test_accuracy': float(test_accuracy),
        'cv_accuracy_mean': float(cv_metrics['mean']),
        'cv_accuracy_std': float(cv_metrics['std']),
        'n_classes': len(class_names),
        'feature_importance': feature_importance.to_dict('records')
    }
    
    return model, metrics

def save_crop_model(model, metrics, feature_cols, class_names, version='v1'):
    """
    Save the trained crop model and metadata
    """
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Save the model
    model_file = os.path.join(models_dir, f'crop_model_{version}.pkl')
    joblib.dump(model, model_file)
    print(f"✅ Model saved: {model_file}")
    
    # Save model metadata
    metadata = {
        'version': version,
        'timestamp': datetime.now().isoformat(),
        'model_type': 'RandomForestClassifier',
        'features': feature_cols,
        'n_classes': len(class_names),
        'class_names': class_names.tolist() if hasattr(class_names, 'tolist') else list(class_names),
        'metrics': metrics,
        'training_date': datetime.now().strftime('%Y-%m-%d')
    }
    
    metadata_file = os.path.join(models_dir, f'crop_model_metadata_{version}.json')
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Model metadata saved: {metadata_file}")
    
    return model_file, metadata_file

def test_trained_model(model_file, metadata_file):
    """
    Test the trained model with sample input
    """
    try:
        model = joblib.load(model_file)
        
        # Load metadata
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        # Sample test input
        sample_input = np.array([[60, 45, 50, 25, 70, 6.5, 800]])  # N, P, K, temp, humidity, ph, rainfall
        
        # Ensure we have the right number of features
        if sample_input.shape[1] != len(metadata['features']):
            print(f"⚠️  Feature mismatch. Expected {len(metadata['features'])}, got {sample_input.shape[1]}")
            # Adjust sample input
            sample_input = sample_input[:, :len(metadata['features'])]
        
        prediction = model.predict(sample_input)
        probabilities = model.predict_proba(sample_input)
        
        predicted_crop = metadata['class_names'][prediction[0]]
        confidence = np.max(probabilities)
        
        print(f"\n🧪 Model Test:")
        print(f"  Input: N=60, P=45, K=50, temp=25, humidity=70, ph=6.5, rainfall=800")
        print(f"  Predicted crop: {predicted_crop}")
        print(f"  Confidence: {confidence:.3f}")
        
        # Show top 3 predictions
        top_3_indices = np.argsort(probabilities[0])[-3:][::-1]
        print(f"  Top 3 predictions:")
        for i, idx in enumerate(top_3_indices):
            crop_name = metadata['class_names'][idx]
            prob = probabilities[0][idx]
            print(f"    {i+1}. {crop_name}: {prob:.3f}")
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")

def train_crop_recommendation_system():
    """
    Main training pipeline for crop recommendation system
    """
    print("="*60)
    print("🌱 CROP RECOMMENDATION MODEL TRAINING")
    print("="*60)
    
    try:
        # Step 1: Load processed data
        df = load_processed_data()
        
        # Step 2: Prepare training data (simplified)
        X, y, feature_cols, class_names = prepare_training_data(df)
        
        # Step 3: Train the model
        model, metrics = train_crop_model(X, y, feature_cols, class_names)
        
        # Step 4: Save the model
        model_file, metadata_file = save_crop_model(model, metrics, feature_cols, class_names)
        
        # Step 5: Test the model
        test_trained_model(model_file, metadata_file)
        
        print("\n" + "="*60)
        print("🎉 CROP MODEL TRAINING COMPLETED SUCCESSFULLY!")
        print("="*60)
        
        return model, metrics
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    # Run the training pipeline
    train_crop_recommendation_system()