"""
FastAPI Interface for Crop AI Predictions
Provides RESTful endpoints for crop AI predictions
"""

import json
import os
import sys
from typing import Dict, Any, List, Optional
from datetime import datetime

# FastAPI imports
from fastapi import FastAPI, HTTPException, status

from pydantic import BaseModel, Field
import uvicorn

from fastapi.middleware.cors import CORSMiddleware

# Add this right after creating your FastAPI app
app = FastAPI(
    title="Crop AI Prediction API",
    description="AI-powered crop, fertilizer, and profit analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",                   # Local development
        "http://localhost:5173",                   # Vite dev server
        "http://127.0.0.1:3000",                   # Alternative localhost
        "http://127.0.0.1:5173",                   # Alternative Vite
        # Add your frontend domains here
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Or specify: ["GET", "POST", "PUT", "DELETE"]
    allow_headers=["*"],  # Or specify needed headers
    expose_headers=["*"],  # Expose custom headers if needed
    max_age=600,  # Preflight request cache time in seconds
)
def is_running_on_render():
    """Check if we're running on Render"""
    return os.environ.get('RENDER', False) or 'RENDER_EXTERNAL_URL' in os.environ

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from predict import predict_from_dict, load_all_models

# Add NPK prediction imports
import joblib
import pandas as pd

# Pydantic models for request/response validation
class SoilParameters(BaseModel):
    """Soil nutrient parameters"""
    N: float = Field(..., ge=0, le=300, description="Nitrogen content (0-300)")
    P: float = Field(..., ge=0, le=150, description="Phosphorus content (0-150)")
    K: float = Field(..., ge=0, le=300, description="Potassium content (0-300)")
    ph: float = Field(..., ge=3, le=10, description="pH level (3-10)")

class EnvironmentalParameters(BaseModel):
    """Environmental condition parameters"""
    temperature: float = Field(..., ge=0, le=50, description="Temperature in Celsius (0-50)")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage (0-100)")
    rainfall: float = Field(..., ge=0, le=3000, description="Rainfall in mm (0-3000)")

class FieldParameters(BaseModel):
    """Field-specific parameters"""
    area_ha: float = Field(1.0, ge=0.1, le=1000, description="Area in hectares")
    location: Optional[str] = Field(None, description="Location name")

class PredictionRequest(BaseModel):
    """Complete prediction request model"""
    N: float = Field(..., ge=0, le=300, description="Nitrogen content")
    P: float = Field(..., ge=0, le=150, description="Phosphorus content")
    K: float = Field(..., ge=0, le=300, description="Potassium content")
    ph: float = Field(..., ge=3, le=10, description="pH level")
    temperature: float = Field(..., ge=0, le=50, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    rainfall: float = Field(..., ge=0, le=3000, description="Rainfall in mm")
    area_ha: float = Field(1.0, ge=0.1, le=1000, description="Area in hectares")
    location: Optional[str] = Field(None, description="Location name")

class YieldPredictionRequest(BaseModel):
    """Crop yield prediction request model"""
    crop_type: str = Field(..., description="Type of crop")
    area_ha: float = Field(..., ge=0.1, le=1000, description="Area in hectares")
    latitude: float = Field(..., ge=8, le=37, description="Latitude coordinate")
    longitude: float = Field(..., ge=68, le=97, description="Longitude coordinate")
    temperature: float = Field(..., ge=0, le=50, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    rainfall: float = Field(..., ge=0, le=3000, description="Rainfall in mm")
    N: float = Field(..., ge=0, le=300, description="Nitrogen content")
    P: float = Field(..., ge=0, le=150, description="Phosphorus content")
    K: float = Field(..., ge=0, le=300, description="Potassium content")

class NPKPredictionRequest(BaseModel):
    """NPK prediction request model"""
    lat: float = Field(..., ge=8, le=37, description="Latitude coordinate")
    lon: float = Field(..., ge=68, le=97, description="Longitude coordinate")

class CropPrediction(BaseModel):
    """Crop prediction response"""
    recommended_crop: str
    confidence: float
    reasoning: List[str]

class FertilizerPrediction(BaseModel):
    """Fertilizer prediction response"""
    recommended_fertilizer: str
    application_timing: str
    reasoning: List[str]

class EconomicsAnalysis(BaseModel):
    """Economics analysis response"""
    estimated_yield_per_ha: float
    gross_revenue: float
    total_investment: float
    net_profit: float
    roi_percentage: float
    currency: str

class APIResponse(BaseModel):
    """Standard API response wrapper"""
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    models_loaded: bool
    message: str

class CropAIAPI:
    """
    Clean API wrapper for crop AI system
    Provides standardized interface for FastAPI backend
    """
    
    def __init__(self):
        """Initialize API with pre-loaded models"""
        self.models = None
        self.is_initialized = False
        self.initialize()
    
    def initialize(self):
        """Load all models and initialize the API"""
        try:
            print("🔄 Initializing Crop AI API...")
            self.models = load_all_models()
            self.is_initialized = True
            print("✅ Crop AI API initialized successfully")
            return {"status": "success", "message": "API initialized successfully"}
        except Exception as e:
            print(f"❌ API initialization failed: {e}")
            self.is_initialized = False
            return {"status": "error", "message": f"Initialization failed: {str(e)}"}
    
    def predict_crop_suite(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main prediction endpoint for complete crop analysis
        
        Args:
            input_data: Dictionary containing soil and environmental parameters
            
        Returns:
            Standardized prediction response
        """
        try:
            # Validate input
            validation_result = self._validate_input(input_data)
            if validation_result["status"] == "error":
                return validation_result
            
            # Ensure API is initialized
            if not self.is_initialized:
                init_result = self.initialize()
                if init_result["status"] == "error":
                    return init_result
            
            # Make prediction
            prediction_result = predict_from_dict(input_data)
            
            # Format response for API consumption
            api_response = self._format_api_response(prediction_result, input_data)
            
            return {
                "status": "success",
                "data": api_response,
                "message": "Prediction completed successfully"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Prediction failed: {str(e)}",
                "data": None
            }
    
    def get_crop_recommendation(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get only crop recommendation (simplified endpoint)
        """
        try:
            full_result = self.predict_crop_suite(input_data)
            if full_result["status"] == "success":
                crop_data = full_result["data"]["predictions"]["crop"]
                return {
                    "status": "success",
                    "data": {
                        "recommended_crop": crop_data["recommended_crop"],
                        "confidence_score": crop_data.get("confidence", 0.5),
                        "reasoning": crop_data.get("reasoning", ["Based on soil and climate analysis"]),
                        "alternative_crops": crop_data.get("alternative_crops", [])
                    },
                    "message": "Crop recommendation generated"
                }
            else:
                return full_result
        except Exception as e:
            return {
                "status": "error",
                "message": f"Crop recommendation failed: {str(e)}",
                "data": None
            }
    
    def get_fertilizer_recommendation(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get only fertilizer recommendation (simplified endpoint)
        """
        try:
            full_result = self.predict_crop_suite(input_data)
            if full_result["status"] == "success":
                fertilizer_data = full_result["data"]["predictions"]["fertilizer"]
                return {
                    "status": "success",
                    "data": {
                        "recommended_fertilizer": fertilizer_data["recommended_fertilizer"],
                        "npk_analysis": {
                            "nitrogen": input_data.get("N", 0),
                            "phosphorus": input_data.get("P", 0),
                            "potassium": input_data.get("K", 0)
                        },
                        "application_notes": fertilizer_data.get("reasoning", ["Apply according to crop requirements"])
                    },
                    "message": "Fertilizer recommendation generated"
                }
            else:
                return full_result
        except Exception as e:
            return {
                "status": "error",
                "message": f"Fertilizer recommendation failed: {str(e)}",
                "data": None
            }
    
    def get_profit_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get only profit/ROI analysis (simplified endpoint)
        """
        try:
            full_result = self.predict_crop_suite(input_data)
            if full_result["status"] == "success":
                profit_data = full_result["data"]["predictions"]["economics"]
                return {
                    "status": "success",
                    "data": {
                        "estimated_yield": profit_data.get("estimated_yield_per_ha", 0),
                        "gross_revenue": profit_data.get("gross_revenue", 0),
                        "total_investment": profit_data.get("total_investment", 0),
                        "net_profit": profit_data.get("net_profit", 0),
                        "roi_percentage": profit_data.get("roi_percentage", 0),
                        "area_hectares": input_data.get("area_ha", 1.0)
                    },
                    "message": "Profit analysis completed"
                }
            else:
                return full_result
        except Exception as e:
            return {
                "status": "error",
                "message": f"Profit analysis failed: {str(e)}",
                "data": None
            }
    
    def health_check(self) -> Dict[str, Any]:
        """
        API health check endpoint
        """
        return {
            "status": "success" if self.is_initialized else "error",
            "service": "Crop AI API",
            "version": "1.0",
            "models_loaded": self.is_initialized,
            "message": "Service is healthy" if self.is_initialized else "Service needs initialization"
        }
    
    def get_detailed_explanation(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get detailed SHAP-based explanations for all predictions
        """
        try:
            # Validate input
            validation_result = self._validate_input(input_data)
            if validation_result["status"] == "error":
                return validation_result
            
            # Ensure API is initialized
            if not self.is_initialized:
                init_result = self.initialize()
                if init_result["status"] == "error":
                    return init_result
            
            # Make prediction to get full result
            prediction_result = predict_from_dict(input_data)
            
            # Extract explanations from the prediction result
            explanations = {
                "crop_explanation": {
                    "recommended_crop": prediction_result.get("recommended_crop", "Not available"),
                    "confidence": prediction_result.get("confidence", 0.5),
                    "reasoning": prediction_result.get("why", ["Analysis based on soil and climate conditions"]),
                    "method": prediction_result.get("method", "ml_model")
                },
                "fertilizer_explanation": {
                    "recommended_fertilizer": prediction_result.get("fertilizer_recommendation", {}).get("fertilizer", "Not available"),
                    "reasoning": prediction_result.get("fertilizer_recommendation", {}).get("reasoning", ["Based on soil nutrient analysis"]),
                    "npk_impact": {
                        "nitrogen_level": input_data.get("N", 0),
                        "phosphorus_level": input_data.get("P", 0),
                        "potassium_level": input_data.get("K", 0),
                        "ph_level": input_data.get("ph", 7.0)
                    }
                },
                "economics_explanation": {
                    "expected_yield": prediction_result.get("expected_yield_t_per_acre", 0),
                    "profit_factors": prediction_result.get("profit_breakdown", {}),
                    "environmental_impact": {
                        "temperature": input_data.get("temperature", 25),
                        "humidity": input_data.get("humidity", 70),
                        "rainfall": input_data.get("rainfall", 500)
                    }
                },
                "model_interpretability": {
                    "feature_importance": prediction_result.get("feature_importance", {}),
                    "prediction_confidence": prediction_result.get("confidence", 0.5),
                    "model_version": prediction_result.get("model_version", "1.0"),
                    "explanation_method": "SHAP + Feature Importance"
                }
            }
            
            return {
                "status": "success",
                "data": explanations,
                "message": "Detailed explanations generated successfully"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Detailed explanation failed: {str(e)}",
                "data": None
            }
    
    def _validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate input data for API requests
        """
        required_fields = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
        missing_fields = []
        
        for field in required_fields:
            if field not in input_data:
                missing_fields.append(field)
        
        if missing_fields:
            return {
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}",
                "required_fields": required_fields
            }
        
        # Validate data types and ranges
        try:
            # Check if values are numeric
            for field in required_fields:
                float(input_data[field])
            
            # Basic range validation
            if not (0 <= input_data["N"] <= 300):
                return {"status": "error", "message": "Nitrogen (N) should be between 0-300"}
            if not (0 <= input_data["P"] <= 150):
                return {"status": "error", "message": "Phosphorus (P) should be between 0-150"}
            if not (0 <= input_data["K"] <= 300):
                return {"status": "error", "message": "Potassium (K) should be between 0-300"}
            if not (0 <= input_data["temperature"] <= 50):
                return {"status": "error", "message": "Temperature should be between 0-50°C"}
            if not (0 <= input_data["humidity"] <= 100):
                return {"status": "error", "message": "Humidity should be between 0-100%"}
            if not (3 <= input_data["ph"] <= 10):
                return {"status": "error", "message": "pH should be between 3-10"}
            if not (0 <= input_data["rainfall"] <= 3000):
                return {"status": "error", "message": "Rainfall should be between 0-3000mm"}
            
            return {"status": "success", "message": "Input validation passed"}
            
        except ValueError:
            return {
                "status": "error",
                "message": "All input values must be numeric"
            }
    
    def _format_api_response(self, prediction_result: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format prediction result for clean API response
        """
        # Extract fertilizer recommendation
        fertilizer_rec = prediction_result.get("fertilizer_recommendation", {})
        fertilizer_name = fertilizer_rec.get("fertilizer", "Not available")
        
        # Extract profit breakdown  
        profit_breakdown = prediction_result.get("profit_breakdown", {})
        
        formatted_response = {
            "input_parameters": {
                "soil_nutrients": {
                    "nitrogen": input_data.get("N", 0),
                    "phosphorus": input_data.get("P", 0),
                    "potassium": input_data.get("K", 0),
                    "ph_level": input_data.get("ph", 7.0)
                },
                "environmental_conditions": {
                    "temperature": input_data.get("temperature", 25),
                    "humidity": input_data.get("humidity", 70),
                    "rainfall": input_data.get("rainfall", 500)
                },
                "field_info": {
                    "area_hectares": input_data.get("area_ha", 1.0),
                    "location": input_data.get("location", "Not specified")
                }
            },
            "predictions": {
                "crop": {
                    "recommended_crop": prediction_result.get("recommended_crop", "Not available"),
                    "confidence": prediction_result.get("confidence", 0.5),
                    "reasoning": prediction_result.get("why", ["Analysis based on soil and climate conditions"]),
                    "alternative_crops": prediction_result.get("alternative_crops", [])
                },
                "fertilizer": {
                    "recommended_fertilizer": fertilizer_name,
                    "application_timing": "As per crop growth stage",
                    "reasoning": fertilizer_rec.get("reasoning", ["Based on soil nutrient analysis"])
                },
                "economics": {
                    "estimated_yield_per_ha": prediction_result.get("expected_yield_t_per_acre", 0) * 2.47, # Convert to per hectare
                    "gross_revenue": profit_breakdown.get("gross_revenue", 0),
                    "total_investment": profit_breakdown.get("total_cost", 0),
                    "net_profit": profit_breakdown.get("net_profit", 0),
                    "roi_percentage": profit_breakdown.get("roi_percent", 0),
                    "currency": "INR"
                }
            },
            "metadata": {
                "prediction_timestamp": prediction_result.get("timestamp", "Not available"),
                "model_version": prediction_result.get("model_version", "1.0"),
                "api_version": "1.0",
                "method": prediction_result.get("method", "ml_model")
            }
        }
        
        return formatted_response
    
    def predict_yield(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict crop yield based on crop type, area, location, weather, and soil conditions
        
        Args:
            input_data: Dictionary containing crop_type, area_ha, latitude, longitude, 
                       temperature, humidity, rainfall, N, P, K
            
        Returns:
            Yield prediction with confidence and factors
        """
        try:
            # Validate required fields for yield prediction
            required_fields = ["crop_type", "area_ha", "latitude", "longitude", "temperature", "humidity", "rainfall", "N", "P", "K"]
            missing_fields = [field for field in required_fields if field not in input_data]
            
            if missing_fields:
                return {
                    "status": "error",
                    "message": f"Missing required fields: {', '.join(missing_fields)}",
                    "data": None
                }
            
            # TODO: Implement actual yield prediction model
            # For now, using a simple heuristic based on crop type and conditions
            
            crop_type = input_data["crop_type"].lower()
            temperature = input_data["temperature"]
            rainfall = input_data["rainfall"]
            humidity = input_data["humidity"]
            n = input_data["N"]
            p = input_data["P"]
            k = input_data["K"]
            
            # Base yields for different crops (tons per hectare)
            base_yields = {
                'rice': 4.5,
                'maize': 3.2,
                'wheat': 3.0,
                'cotton': 1.8,
                'sugarcane': 80.0,
                'soybean': 2.5,
                'potato': 25.0,
                'tomato': 35.0,
                'onion': 20.0,
                'chickpea': 1.2,
                'kidneybeans': 1.5,
                'pigeonpeas': 1.0,
                'mothbeans': 0.8,
                'mungbean': 0.9,
                'blackgram': 0.7,
                'lentil': 1.1,
                'pomegranate': 8.0,
                'banana': 40.0,
                'mango': 10.0,
                'grapes': 15.0,
                'watermelon': 30.0,
                'muskmelon': 25.0,
                'apple': 12.0,
                'orange': 20.0,
                'papaya': 45.0,
                'coconut': 8.0,
                'jute': 2.0,
                'coffee': 0.5
            }
            
            base_yield = base_yields.get(crop_type, 3.0)
            
            # Adjust based on conditions
            temp_factor = 1.0
            if 20 <= temperature <= 30:
                temp_factor = 1.1
            elif temperature < 15 or temperature > 35:
                temp_factor = 0.8
            
            rainfall_factor = 1.0
            if 100 <= rainfall <= 200:
                rainfall_factor = 1.1
            elif rainfall < 50 or rainfall > 300:
                rainfall_factor = 0.8
            
            soil_factor = 1.0
            if 40 <= n <= 60 and 30 <= p <= 50 and 30 <= k <= 50:
                soil_factor = 1.1
            elif n < 20 or p < 15 or k < 20:
                soil_factor = 0.8
            
            predicted_yield = base_yield * temp_factor * rainfall_factor * soil_factor
            
            # Determine key factors
            factors = []
            if temp_factor > 1.0:
                factors.append("Optimal temperature for selected crop")
            elif temp_factor < 1.0:
                factors.append("Temperature may affect crop growth")
            
            if rainfall_factor > 1.0:
                factors.append("Adequate rainfall in the region")
            elif rainfall_factor < 1.0:
                factors.append("Rainfall may be insufficient")
            
            if soil_factor > 1.0:
                factors.append("Balanced soil nutrients")
            elif soil_factor < 1.0:
                factors.append("Soil nutrients may need adjustment")
            
            factors.append(f"Base yield for {crop_type}: {base_yield} tons/ha")
            
            return {
                "status": "success",
                "data": {
                    "predicted_yield_tons_per_ha": round(predicted_yield, 2),
                    "crop_type": crop_type,
                    "area_ha": input_data["area_ha"],
                    "total_predicted_yield": round(predicted_yield * input_data["area_ha"], 2),
                    "confidence_score": 0.75,  # Placeholder
                    "key_factors": factors,
                    "input_conditions": {
                        "temperature_c": temperature,
                        "rainfall_mm": rainfall,
                        "humidity_percent": humidity,
                        "soil_npk": f"{n}-{p}-{k}"
                    }
                },
                "message": "Yield prediction completed successfully"
            }
            
        except Exception as e:
            print(f"Yield prediction error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "status": "error",
                "message": f"Yield prediction failed: {str(e)}",
                "data": None
            }
    
    def predict_npk_from_location(self, latitude: float, longitude: float) -> Dict[str, float]:
        """
        Predict NPK values based on latitude and longitude
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Dictionary with N, P, K predictions
        """
        try:
            import os
            models = {}
            
            # Get the script directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            
            model_files = {
                'N': os.path.join(script_dir, 'models', 'npk_n_predictor.pkl'),
                'P': os.path.join(script_dir, 'models', 'npk_p_predictor.pkl'), 
                'K': os.path.join(script_dir, 'models', 'npk_k_predictor.pkl')
            }
            
            print(f"Loading NPK models from: {model_files['N']}")
            
            # Load models
            all_loaded = True
            for nutrient, model_file in model_files.items():
                try:
                    if os.path.exists(model_file):
                        models[nutrient] = joblib.load(model_file)
                        print(f"✓ Loaded {nutrient} model")
                    else:
                        print(f"✗ {model_file} not found")
                        all_loaded = False
                        break
                except Exception as e:
                    print(f"✗ Error loading {model_file}: {e}")
                    all_loaded = False
                    break
            
            if not all_loaded:
                print("Using default NPK values")
                return {'N': 50.0, 'P': 40.0, 'K': 30.0}
            
            # Make predictions
            input_data = pd.DataFrame([[latitude, longitude]], columns=['latitude', 'longitude'])
            
            predictions = {}
            for nutrient, model in models.items():
                pred = model.predict(input_data)[0]
                predictions[nutrient] = max(0, float(pred))  # Ensure non-negative
            
            print(f"NPK Predictions: {predictions}")
            return predictions
            
        except Exception as e:
            print(f"NPK prediction error: {e}")
            import traceback
            traceback.print_exc()
            return {'N': 50.0, 'P': 40.0, 'K': 30.0}

# Create global API instance
crop_ai_api = CropAIAPI()

# Create FastAPI app
app = FastAPI(
    title="Crop AI Prediction API",
    description="AI-powered crop, fertilizer, and profit analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FastAPI Routes

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {"message": "Crop AI Prediction API", "version": "1.0.0", "docs": "/docs"}

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    result = crop_ai_api.health_check()
    return HealthCheckResponse(**result)

@app.post("/predict", response_model=APIResponse)
async def predict_crop_suite(request: PredictionRequest):
    """
    Complete crop analysis prediction
    
    Provides comprehensive analysis including:
    - Crop recommendation
    - Fertilizer recommendation  
    - Economic analysis (yield, profit, ROI)
    """
    try:
        input_data = request.dict()
        result = crop_ai_api.predict_crop_suite(input_data)
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return APIResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@app.post("/predict/crop", response_model=APIResponse)
async def get_crop_recommendation(request: PredictionRequest):
    """
    Get crop recommendation only
    
    Returns the most suitable crop based on soil and environmental conditions
    """
    try:
        input_data = request.dict()
        result = crop_ai_api.get_crop_recommendation(input_data)
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return APIResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Crop recommendation failed: {str(e)}"
        )

@app.post("/predict/fertilizer", response_model=APIResponse)
async def get_fertilizer_recommendation(request: PredictionRequest):
    """
    Get fertilizer recommendation only
    
    Returns the most suitable fertilizer based on soil nutrient analysis
    """
    try:
        input_data = request.dict()
        result = crop_ai_api.get_fertilizer_recommendation(input_data)
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return APIResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fertilizer recommendation failed: {str(e)}"
        )

@app.post("/predict/economics", response_model=APIResponse)
async def get_profit_analysis(request: PredictionRequest):
    """
    Get economic analysis only
    
    Returns yield prediction, profit analysis, and ROI calculations
    """
    try:
        input_data = request.dict()
        result = crop_ai_api.get_profit_analysis(input_data)
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return APIResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profit analysis failed: {str(e)}"
        )

@app.post("/predict/explain", response_model=APIResponse)
async def get_detailed_explanation(request: PredictionRequest):
    """
    Get detailed SHAP-based explanations for predictions
    
    Returns comprehensive analysis of why specific recommendations were made
    including feature importance and model interpretability insights
    """
    try:
        input_data = request.dict()
        result = crop_ai_api.get_detailed_explanation(input_data)
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return APIResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Detailed explanation failed: {str(e)}"
        )

@app.post("/predict/yield", response_model=APIResponse)
async def predict_yield(request: YieldPredictionRequest):
    """
    Predict crop yield based on crop type, location, weather, and soil conditions
    
    Returns yield prediction in tons per hectare and total yield for the specified area
    """
    try:
        print(f"Yield Prediction Request: crop={request.crop_type}, area={request.area_ha}, lat={request.latitude}, lon={request.longitude}")
        input_data = request.dict()
        result = crop_ai_api.predict_yield(input_data)
        print(f"Yield Prediction Result: {result['status']}")
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return APIResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Yield endpoint error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Yield prediction failed: {str(e)}"
        )

@app.post("/predict/npk", response_model=APIResponse)
async def predict_npk(request: NPKPredictionRequest):
    """
    Predict NPK values based on latitude and longitude coordinates
    
    Returns estimated soil nutrient values for the given location
    """
    try:
        print(f"NPK Prediction Request: lat={request.lat}, lon={request.lon}")
        result = crop_ai_api.predict_npk_from_location(request.lat, request.lon)
        print(f"NPK Prediction Result: {result}")
        
        return APIResponse(
            status="success",
            data=result,
            message="NPK prediction completed successfully"
        )
    
    except Exception as e:
        print(f"NPK endpoint error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NPK prediction failed: {str(e)}"
        )

# Legacy compatibility functions for existing integrations
def predict_crop_suite_legacy(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy function - use FastAPI endpoints instead"""
    return crop_ai_api.predict_crop_suite(input_data)

def get_crop_recommendation_legacy(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy function - use FastAPI endpoints instead"""
    return crop_ai_api.get_crop_recommendation(input_data)

def get_fertilizer_recommendation_legacy(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy function - use FastAPI endpoints instead"""
    return crop_ai_api.get_fertilizer_recommendation(input_data)

def get_profit_analysis_legacy(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy function - use FastAPI endpoints instead"""
    return crop_ai_api.get_profit_analysis(input_data)

def health_check_legacy() -> Dict[str, Any]:
    """Legacy function - use FastAPI endpoints instead"""
    return crop_ai_api.health_check()

# Development server startup
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=not is_running_on_render(),  # Disable reload in production
        log_level="info"
    )
