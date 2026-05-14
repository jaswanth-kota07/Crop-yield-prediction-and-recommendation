import React, { useState } from 'react';
import { mlAPI, recommendationsAPI } from '../services/api';
import { weatherService } from '../services/weatherService';
import { Loader2, Droplets, MapPin, Thermometer, Wind, Target, Sparkles, Navigation } from 'lucide-react';

const CropRecommendation = () => {
  const [formData, setFormData] = useState({
    latitude: '', longitude: '', N: '', P: '', K: '', temperature: '', humidity: '', ph: '', rainfall: ''
  });
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [predictingNPK, setPredictingNPK] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const fetchGroqInsights = async (cropName, payload) => {
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) return "AI insights unavailable (API key missing).";
      
      const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
      const prompt = `Act as an agricultural expert. Given the soil conditions (N: ${payload.N}, P: ${payload.P}, K: ${payload.K}, pH: ${payload.ph}) and weather (Temp: ${payload.temperature}°C, Humidity: ${payload.humidity}%, Rainfall: ${payload.rainfall}mm), provide fertilizer recommendations and general farming suggestions for the crop: ${cropName}. 

CRITICAL INSTRUCTIONS:
- Provide exactly 3 to 4 short bullet points.
- Do NOT write paragraphs.
- Keep each point under 15 words.`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) return "AI insights unavailable.";
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No insights generated.";
    } catch (err) {
      console.warn("Groq fetch failed:", err);
      return "AI insights unavailable.";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Auto-predict NPK when both coordinates are entered
    if (name === 'latitude' || name === 'longitude') {
      const lat = name === 'latitude' ? value : updatedFormData.latitude;
      const lon = name === 'longitude' ? value : updatedFormData.longitude;
      
      if (lat && lon && lat.trim() !== '' && lon.trim() !== '') {
        // Debounce the prediction to avoid too many API calls
        setTimeout(() => {
          predictNPKFromCoords(lat, lon);
        }, 500);
      }
    }
  };

  const predictNPKFromCoords = async (lat, lon) => {
    if (!lat || !lon) return;
    
    setPredictingNPK(true);
    setError('');
    
    try {
      const response = await mlAPI.predictNPK(parseFloat(lat), parseFloat(lon));
      const npkData = response.data;
      
      // Validate NPK data and ensure they're valid numbers
      const validateNPK = (value) => {
        const num = Number(value);
        if (isNaN(num) || !isFinite(num) || num < 0) {
          console.warn(`Invalid NPK value: ${value}, using 0`);
          return 0;
        }
        return Math.max(0, Math.min(300, Math.round(num))); // Clamp between 0-300
      };
      
      const nValue = validateNPK(npkData.N);
      const pValue = validateNPK(npkData.P);
      const kValue = validateNPK(npkData.K);
      
      setFormData(prev => ({
        ...prev,
        N: nValue,
        P: pValue,
        K: kValue
      }));
    } catch (err) {
      console.warn('NPK prediction failed:', err);
      setError('Failed to predict NPK values from coordinates. Please enter manually.');
      // Don't set NPK values to NaN, leave them empty or set defaults
      setFormData(prev => ({
        ...prev,
        N: '',
        P: '',
        K: ''
      }));
    } finally {
      setPredictingNPK(false);
    }
  };

  const fillDemoData = () => {
    setFormData({
      latitude: 28.6139, longitude: 77.2090, N: 50, P: 40, K: 30, temperature: 28, humidity: 75, ph: 6.5, rainfall: 150
    });
  };

  const handleAutoDetect = async () => {
    setDetecting(true);
    setError('');
    
    try {
      // 1. Get Location
      const coords = await weatherService.getLocation();
      
      // 2. Update coordinates
      setFormData(prev => ({
        ...prev,
        latitude: coords.lat.toFixed(4),
        longitude: coords.lon.toFixed(4)
      }));
      
      // 3. Predict NPK from coordinates
      await predictNPKFromCoords(coords.lat, coords.lon);
      
      // 4. Get Weather
      let weather;
      try {
        weather = await weatherService.getCurrentWeather(coords.lat, coords.lon);
      } catch (weatherErr) {
        if (weatherErr.response?.status === 401) {
          throw new Error('OpenWeatherMap API key (VITE_OPENWEATHER_API_KEY) is invalid or not yet active. Please check your .env file.');
        }
        throw new Error('Weather detection failed: ' + (weatherErr.message || 'Unknown error'));
      }
      
      setFormData(prev => ({
        ...prev,
        temperature: Math.max(0, Math.min(50, Math.round(weather.temperature || 25))),
        humidity: Math.max(0, Math.min(100, Math.round(weather.humidity || 60))),
        rainfall: Math.max(0, Math.min(3000, Math.round(weather.rainfall || 1000))),
        ph: 6.5 // Default pH value
      }));
      
    } catch (err) {
      setError(err.message || 'Failed to auto-detect location or weather data.');
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    // Validate required fields (exclude latitude/longitude as they're optional)
    const requiredFields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];
    for (let key of requiredFields) {
      if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
        setError(`Please fill out the ${key} field.`);
        setLoading(false);
        return;
      }
    }

    try {
      // Validate and convert values with proper ranges
      const validateNumber = (value, fieldName, min, max) => {
        const num = Number(value);
        if (isNaN(num) || !isFinite(num)) {
          throw new Error(`${fieldName} must be a valid number`);
        }
        if (num < min || num > max) {
          throw new Error(`${fieldName} must be between ${min} and ${max}`);
        }
        return num;
      };

      const payload = {
        N: validateNumber(formData.N, 'Nitrogen (N)', 0, 300),
        P: validateNumber(formData.P, 'Phosphorus (P)', 0, 150),
        K: validateNumber(formData.K, 'Potassium (K)', 0, 300),
        temperature: validateNumber(formData.temperature, 'Temperature', 0, 50),
        humidity: validateNumber(formData.humidity, 'Humidity', 0, 100),
        ph: validateNumber(formData.ph, 'pH', 3, 10),
        rainfall: validateNumber(formData.rainfall, 'Rainfall', 0, 3000)
      };

      // 1. Get recommendation from ML API
      const mlRes = await mlAPI.predictCrop(payload);
      const dataPayload = mlRes.data?.data || mlRes.data;
      
      if (dataPayload?.error) {
        throw new Error(`AI Analysis Error: ${dataPayload.error}`);
      }
      
      const recommendedCrop = dataPayload?.recommended_crop;
      const alternativeCrops = dataPayload?.alternative_crops || [{crop: recommendedCrop, confidence: 1}];

      if (!recommendedCrop) throw new Error('Could not get a valid recommendation');

      // 2. Fetch Groq insights for the TOP crop to store in DB
      const topCropInsights = await fetchGroqInsights(recommendedCrop, payload);

      // 3. Save to database only the top priority
      await recommendationsAPI.save({
        ...payload,
        n_content: payload.N,
        p_content: payload.P,
        k_content: payload.K,
        ph_value: payload.ph,
        recommended_crop: recommendedCrop,
        gemini_details: topCropInsights
      });

      // 4. Fetch insights for all recommended crops concurrently
      const cropsWithInsights = await Promise.all(
        alternativeCrops.map(async (c) => {
           const insights = (c.crop === recommendedCrop) ? topCropInsights : await fetchGroqInsights(c.crop, payload);
           return { ...c, details: insights };
        })
      );

      setResult({
        crops: cropsWithInsights,
        primaryCrop: recommendedCrop
      });
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred. Make sure ML API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Crop Recommendation</h2>
        <p className="text-gray-500 mt-2">Enter soil and climate parameters to find the most suitable crop using AI.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100 flex justify-between items-center">
          <h3 className="font-semibold text-green-800">Manual Data Input</h3>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={handleAutoDetect} 
              disabled={detecting}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-white px-3 py-1.5 rounded border border-emerald-200 flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
            >
              {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {detecting ? 'Detecting...' : 'Auto-detect'}
            </button>
            <button 
              type="button" 
              onClick={fillDemoData} 
              className="text-sm font-medium text-primary hover:text-primary-dark bg-white px-3 py-1.5 rounded border border-green-200 shadow-sm transition-all hover:shadow"
            >
              Fill Demo Data
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 flex items-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Location Coordinates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Navigation className="w-4 h-4 text-red-500" /> Latitude
              </label>
              <input 
                type="number" 
                step="any" 
                name="latitude" 
                value={formData.latitude || ''} 
                onChange={handleChange} 
                className="input" 
                placeholder="e.g., 28.6139" 
                min="-90"
                max="90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Navigation className="w-4 h-4 text-red-500" /> Longitude
              </label>
              <input 
                type="number" 
                step="any" 
                name="longitude" 
                value={formData.longitude || ''} 
                onChange={handleChange} 
                className="input" 
                placeholder="e.g., 77.2090" 
                min="-180"
                max="180"
              />
            </div>
            <div className="flex items-end">
              {predictingNPK && (
                <div className="text-sm text-blue-600 flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Predicting NPK...
                </div>
              )}
            </div>

            {/* NPK Values */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Target className="w-4 h-4 text-green-500" /> Nitrogen (N)
                {predictingNPK && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
              </label>
              <input 
                type="number" 
                step="any" 
                name="N" 
                value={formData.N || ''} 
                onChange={handleChange} 
                className="input" 
                placeholder="Auto-filled from coordinates" 
                disabled={predictingNPK}
                min="0"
                max="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Target className="w-4 h-4 text-green-500" /> Phosphorus (P)
                {predictingNPK && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
              </label>
              <input 
                type="number" 
                step="any" 
                name="P" 
                value={formData.P || ''} 
                onChange={handleChange} 
                className="input" 
                placeholder="Auto-filled from coordinates" 
                disabled={predictingNPK}
                min="0"
                max="150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Target className="w-4 h-4 text-green-500" /> Potassium (K)
                {predictingNPK && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
              </label>
              <input 
                type="number" 
                step="any" 
                name="K" 
                value={formData.K || ''} 
                onChange={handleChange} 
                className="input" 
                placeholder="Auto-filled from coordinates" 
                disabled={predictingNPK}
                min="0"
                max="300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Thermometer className="w-4 h-4 text-orange-500" /> Temperature (°C)
              </label>
              <input 
                type="number" 
                step="any" 
                name="temperature" 
                value={formData.temperature || ''} 
                onChange={handleChange} 
                className="input" 
                placeholder="e.g., 25" 
                min="0"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Wind className="w-4 h-4 text-blue-400" /> Humidity (%)
              </label>
              <input 
                type="number" 
                step="any" 
                name="humidity" 
                value={formData.humidity || ''} 
                onChange={handleChange} 
                className="input" 
                placeholder="e.g., 80" 
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH Level</label>
              <input 
                type="number" 
                name="ph" 
                value={formData.ph || ''} 
                onChange={handleChange} 
                className="input" 
                placeholder="e.g., 6.5" 
                min="3"
                max="10"
                step="0.1"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Droplets className="w-4 h-4 text-blue-500" /> Rainfall (mm)
              </label>
              <input 
                type="number" 
                step="any" 
                name="rainfall" 
                value={formData.rainfall || ''} 
                onChange={handleChange} 
                className="input max-w-sm" 
                placeholder="e.g., 150" 
                min="0"
                max="3000"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" disabled={loading} className="btn btn-primary min-w-[200px] text-lg">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Get Recommendation'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="mt-8 animate-fade-in space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Top Recommendations</h3>
            <p className="text-gray-500">Based on your soil and climate data</p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {result.crops.map((item, idx) => (
              <div key={idx} className="card p-6 md:p-8 bg-white text-gray-800 border border-green-100 relative overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1 text-green-600">
                      Recommendation #{idx + 1}
                    </h3>
                    <h1 className="text-4xl font-bold capitalize text-gray-800">{item.crop}</h1>
                  </div>
                  <div className="px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-800">
                    {Math.round(item.confidence * 100)}% Match
                  </div>
                </div>
                
                <div className="p-5 rounded-xl border bg-gray-50 border-gray-100">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-800">
                    <Target className="w-5 h-5 text-green-600" /> Fertilizer & AI Insights
                  </h4>
                  <div className="leading-relaxed text-sm md:text-base whitespace-pre-wrap text-gray-600">
                    {item.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropRecommendation;
