import React, { useState } from 'react';
import { mlAPI } from '../services/api';
import { weatherService } from '../services/weatherService';
import { Loader2, Droplets, MapPin, Thermometer, Wind, TrendingUp, Sprout } from 'lucide-react';

const CropYieldPrediction = () => {
  const [formData, setFormData] = useState({
    cropType: '',
    area: '',
    latitude: '',
    longitude: '',
    temperature: '',
    humidity: '',
    rainfall: '',
    N: '',
    P: '',
    K: ''
  });
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const cropOptions = [
    'rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas',
    'mothbeans', 'mungbean', 'blackgram', 'lentil', 'pomegranate',
    'banana', 'mango', 'grapes', 'watermelon', 'muskmelon', 'apple',
    'orange', 'papaya', 'coconut', 'cotton', 'jute', 'coffee'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchGroqYieldInsights = async (cropType, payload) => {
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) return "AI insights unavailable (API key missing).";
      
      const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
      const prompt = `Act as an agricultural expert. Given the soil conditions (N: ${payload.N}, P: ${payload.P}, K: ${payload.K}) and weather (Temp: ${payload.temperature}°C, Humidity: ${payload.humidity}%, Rainfall: ${payload.rainfall}mm), provide recommendations on how to maximize the yield for ${cropType}. 

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

  const handleAutoDetect = async () => {
    setDetecting(true);
    setError('');

    try {
      // Get Location
      const coords = await weatherService.getLocation();

      // Get Weather
      let weather;
      try {
        weather = await weatherService.getCurrentWeather(coords.lat, coords.lon);
      } catch (weatherErr) {
        if (weatherErr.response?.status === 401) {
          throw new Error('OpenWeatherMap API key (VITE_OPENWEATHER_API_KEY) is invalid or not yet active. Please check your .env file.');
        }
        throw new Error('Weather detection failed: ' + (weatherErr.message || 'Unknown error'));
      }

      // TODO: Predict NPK from latitude using trained model
      // For now, using API call
      let npkData = { N: 50, P: 40, K: 30 }; // Defaults
      
      try {
        const npkResponse = await mlAPI.predictNPK(coords.lat, coords.lon);
        if (npkResponse.data?.data) {
          npkData = npkResponse.data.data;
        }
      } catch (npkErr) {
        console.warn('NPK prediction failed, using defaults:', npkErr);
      }

      setFormData({
        ...formData,
        latitude: coords.lat.toFixed(6),
        longitude: coords.lon.toFixed(6),
        temperature: Math.round(weather.temperature),
        humidity: Math.round(weather.humidity),
        rainfall: Math.round(weather.rainfall),
        N: npkData.N,
        P: npkData.P,
        K: npkData.K
      });

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

    // Validate
    const requiredFields = ['cropType', 'area', 'latitude', 'longitude', 'temperature', 'humidity', 'rainfall', 'N', 'P', 'K'];
    for (let key of requiredFields) {
      if (formData[key] === '') {
        setError('Please fill out all fields.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        crop_type: formData.cropType,
        area_ha: Number(formData.area),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        temperature: Number(formData.temperature),
        humidity: Number(formData.humidity),
        rainfall: Number(formData.rainfall),
        N: Number(formData.N),
        P: Number(formData.P),
        K: Number(formData.K)
      };

      // TODO: Call yield prediction API
      // For now, using placeholder
      const response = await mlAPI.predictYield(payload);
      const data = response.data?.data || response.data;
      
      if (data?.error) {
        throw new Error(`Yield Prediction Error: ${data.error}`);
      }
      
      const aiInsights = await fetchGroqYieldInsights(formData.cropType, payload);
      
      const yieldResult = {
        predicted_yield: data.predicted_yield_tons_per_ha || 0,
        total_yield: data.total_predicted_yield || 0,
        confidence: data.confidence_score || 0.75,
        factors: data.key_factors || ['Prediction completed'],
        insights: aiInsights
      };

      setResult(yieldResult);

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Crop Yield Prediction</h2>
        <p className="text-gray-500 mt-2">Predict crop yield based on location, weather, and soil conditions using advanced AI models.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100 flex justify-between items-center">
          <h3 className="font-semibold text-blue-800">Yield Prediction Input</h3>
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={detecting}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded border border-blue-200 flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
          >
            {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
            {detecting ? 'Detecting...' : 'Auto-detect Location & Weather'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 flex items-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Sprout className="w-4 h-4 text-green-500" /> Crop Type
              </label>
              <select name="cropType" value={formData.cropType} onChange={handleChange} className="input">
                <option value="">Select Crop</option>
                {cropOptions.map(crop => (
                  <option key={crop} value={crop}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area (Hectares)</label>
              <input type="number" step="0.01" name="area" value={formData.area} onChange={handleChange} className="input" placeholder="e.g., 1.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input type="number" step="0.000001" name="latitude" value={formData.latitude} onChange={handleChange} className="input" placeholder="e.g., 28.6139" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input type="number" step="0.000001" name="longitude" value={formData.longitude} onChange={handleChange} className="input" placeholder="e.g., 77.2090" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Thermometer className="w-4 h-4 text-orange-500" /> Temperature (°C)
              </label>
              <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} className="input" placeholder="Auto-filled" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Wind className="w-4 h-4 text-blue-400" /> Humidity (%)
              </label>
              <input type="number" step="0.1" name="humidity" value={formData.humidity} onChange={handleChange} className="input" placeholder="Auto-filled" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Droplets className="w-4 h-4 text-blue-500" /> Rainfall (mm)
              </label>
              <input type="number" step="0.1" name="rainfall" value={formData.rainfall} onChange={handleChange} className="input" placeholder="Auto-filled" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nitrogen (N)</label>
              <input type="number" step="0.1" name="N" value={formData.N} onChange={handleChange} className="input" placeholder="Predicted from location" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phosphorus (P)</label>
              <input type="number" step="0.1" name="P" value={formData.P} onChange={handleChange} className="input" placeholder="Predicted from location" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Potassium (K)</label>
              <input type="number" step="0.1" name="K" value={formData.K} onChange={handleChange} className="input" placeholder="Predicted from location" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" disabled={loading} className="btn btn-primary min-w-[200px] text-lg">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Predict Yield'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="mt-8 animate-fade-in">
          <div className="card p-8 bg-gradient-to-br from-blue-600 to-indigo-800 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none"></div>

            <h3 className="text-lg font-medium text-blue-100 uppercase tracking-wider mb-2">Predicted Yield</h3>
            <h1 className="text-5xl font-bold mb-2">{result.predicted_yield} tons/ha</h1>
            <p className="text-blue-200 mb-2">Total: {result.total_yield} tons for {formData.area} ha</p>
            <p className="text-blue-200 mb-6">Confidence: {(result.confidence * 100).toFixed(1)}%</p>

            <div className="bg-black/20 p-5 rounded-xl border border-white/10 backdrop-blur-md">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Key Factors
              </h4>
              <ul className="text-blue-50 leading-relaxed text-sm md:text-base space-y-1 mb-4">
                {result.factors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-300 mt-1">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
              
              <h4 className="font-semibold mb-2 flex items-center gap-2 pt-3 border-t border-white/10">
                <Sprout className="w-5 h-5 text-green-400" /> AI Insights for Max Yield
              </h4>
              <div className="text-blue-50 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                {result.insights}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropYieldPrediction;