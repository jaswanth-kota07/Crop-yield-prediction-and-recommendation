import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { analysisAPI } from '../services/api';

const ImageAnalysis = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [restricted, setRestricted] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, WEBP).');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setResult(null);
      setError('');
      setRestricted(false);
    }
  };

  const analyzeImage = async () => {
    if (!imagePreview) {
      setError("No image selected.");
      return;
    }

    setLoading(true);
    setError('');
    setRestricted(false);
    setResult(null);

    const base64ImageData = imagePreview.split(',')[1];
    const mimeType = imageFile?.type || "image/jpeg";
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const API_URL = `https://api.groq.com/openai/v1/chat/completions`;
    
    // Helper for retry logic
    const fetchWithRetry = async (url, options, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        const response = await fetch(url, options);
        if (response.status === 429 && i < maxRetries - 1) {
          // Wait longer each time (exponential backoff)
          const waitTime = Math.pow(2, i) * 1000;
          console.warn(`Rate limit hit. Retrying in ${waitTime}ms...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        return response;
      }
    };

    const systemPrompt = `You are a specialized plant pathologist AI. Your response MUST be a single JSON object.
      1. Identify if the image clearly shows a plant, a plant part (like a leaf or flower), or a tree.
      2. If it is NOT a plant (e.g., it's a car, a dog, a person), respond ONLY with the JSON: {"is_plant": false}.
      3. If it IS a plant, respond ONLY with the JSON object in the following required structure:
      {
        "is_plant": true,
        "analysis": {
          "health_status": "Healthy", // Or "Unhealthy" or "Needs Attention"
          "plant_identified": "Name of the plant (e.g., Tomato Plant, Rose Bush)",
          "disease_identified": "Specific Disease Name (e.g., Late Blight, Powdery Mildew)" or "None",
          "description": "A concise, simple explanation (2-3 sentences max) of the plant's current state and the identified issue.",
          "care_suggestions": "List 3 actionable tips formatted as a continuous string with newline characters (\\n) separating each tip."
        }
      }`;

    const payload = {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            { 
              type: "image_url", 
              image_url: { 
                url: `data:${mimeType};base64,${base64ImageData}` 
              } 
            }
          ]
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    };

    try {
      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Model not found. Please ensure you are using a supported Groq model ID.');
        }
        if (response.status === 429) {
          throw new Error('AI is currently busy. Please wait a minute and try again.');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const textContent = data.choices?.[0]?.message?.content;
      
      if (textContent) {
        let textResponse = textContent.trim();
        if (textResponse.startsWith('```json')) textResponse = textResponse.substring(7);
        if (textResponse.endsWith('```')) textResponse = textResponse.substring(0, textResponse.length - 3);
        
        const parsed = JSON.parse(textResponse.trim());
        
        if (parsed.is_plant === false) {
          setRestricted(true);
        } else if (parsed.is_plant && parsed.analysis) {
          setResult(parsed.analysis);
          
          // Save to backend
          await analysisAPI.save({
            image_data: imagePreview,
            health_status: parsed.analysis.health_status,
            disease_identified: parsed.analysis.disease_identified,
            description: parsed.analysis.description,
            care_suggestions: parsed.analysis.care_suggestions
          });
        } else {
          throw new Error("Invalid response format from AI.");
        }
      } else {
        throw new Error("No response generated.");
      }
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Please check your API key or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-green-700 flex justify-center items-center gap-3">
          <ImageIcon className="w-8 h-8" /> Plant Disease Analyzer
        </h2>
        <p className="text-gray-500 mt-2">Take a photo of a plant to check its health and identify possible diseases.</p>
      </div>

      <div className="card p-6 md:p-8">
        {!imagePreview ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-green-50 transition-colors group"
          >
            <Camera className="w-16 h-16 text-gray-400 group-hover:text-primary transition-colors mb-4" />
            <p className="text-lg text-gray-600 mb-1"><span className="font-semibold text-primary">Take a photo</span> or click to upload</p>
            <p className="text-sm text-gray-400">PNG, JPG, or WEBP (Max 5MB)</p>
          </div>
        ) : (
          <div className="text-center">
            <img src={imagePreview} alt="Preview" className="max-h-80 w-auto rounded-lg mx-auto shadow-md mb-6 object-contain" />
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => { setImagePreview(null); setImageFile(null); setResult(null); }} 
                className="btn btn-outline"
                disabled={loading}
              >
                Choose Another
              </button>
              <button 
                onClick={analyzeImage} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyzing...</> : 'Analyze Plant'}
              </button>
            </div>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/png, image/jpeg, image/webp" 
          capture="environment"
          className="hidden" 
        />

        {/* Status Messages */}
        {error && (
          <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Error:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {restricted && (
          <div className="mt-6 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <strong className="font-bold">Access Restricted:</strong> Please upload a plant image only.
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-10 animate-fade-in border-t border-gray-100 pt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Analysis Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm text-gray-500 font-medium mb-1">Plant Type Identified</p>
                <p className="text-xl font-bold text-gray-800">{result.plant_identified}</p>
              </div>
              
              <div className={`rounded-xl p-4 border ${result.health_status === 'Healthy' ? 'bg-green-100 border-green-200' : result.health_status === 'Needs Attention' ? 'bg-yellow-100 border-yellow-200' : 'bg-red-100 border-red-200'}`}>
                <p className="text-sm text-gray-600 font-medium mb-1">Health Status</p>
                <p className={`text-xl font-bold ${result.health_status === 'Healthy' ? 'text-green-700' : result.health_status === 'Needs Attention' ? 'text-yellow-700' : 'text-red-700'}`}>
                  {result.health_status}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-700 mb-2">Disease Identified</h4>
                <p className="text-gray-900 font-medium text-lg">{result.disease_identified}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
                <p className="text-gray-600 leading-relaxed">{result.description}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-3">Care Suggestions</h4>
                <ul className="list-disc pl-5 space-y-2 text-blue-900">
                  {result.care_suggestions.split('\n').filter(s => s.trim() !== "").map((s, i) => (
                    <li key={i}>{s.replace(/^(\d+\.|[-*])\s*/, '').trim()}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysis;
