**A comprehensive AI-powered crop recommendation system that combines machine learning with agricultural domain expertise to provide farmers with optimal crop selection, fertilizer recommendations, and profitability estimates. Features an advanced RandomForest classifier trained on 22 crop varieties with optimized hyperparameters for superior accuracy.
**

🎯 Features
Three AI Models
🌱 Crop Recommender - RandomForest classifier (100 estimators, max_depth=15) trained on 22 crop varieties with soil & weather features
🧪 Fertilizer Recommender - Dynamic ML + lookup system for precise fertilizer suggestions
💰 Profit Estimator - LightGBM regressor predicting yield and profitability
Enhanced Features
🌾 Previous Crop Impact - Automatically adjusts soil NPK levels based on previous crop impact
🗓️ Season Detection - Auto-detects agricultural season based on date/region with crop compatibility
🔗 FastAPI Backend - Modern REST API with automatic documentation and validation

Explainable AI
SHAP Integration - Advanced feature importance explanations for trained models
Rule-based Fallback - Agricultural domain rules when models aren't trained
Human-friendly Insights - Plain English explanations for all recommendations
Interactive Documentation - Swagger UI for easy API testing
Production Ready
FastAPI Backend v2.0.0 - Modern async REST API with automatic validation
Unified API - Single function combining all three models
Input Validation - Robust error handling and data validation
CORS Support - Ready for web application integration
Interactive Docs - Automatic API documentation at /docs
Enhanced Model Support - Latest RandomForest crop classifier with 22 varieties
🌐 API Endpoints
FastAPI Endpoints (NEW)
GET / - API information
GET /health - Health check and model status
POST /predict - Complete prediction suite
POST /predict/crop - Crop recommendation only
POST /predict/fertilizer - Fertilizer recommendation only
POST /predict/economics - Economic analysis only
POST /predict/explain - Detailed SHAP-based explanations
