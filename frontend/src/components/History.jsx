import React, { useState, useEffect } from 'react';
import { recommendationsAPI, analysisAPI } from '../services/api';

const History = () => {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [recs, setRecs] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [recsRes, analysisRes] = await Promise.all([
          recommendationsAPI.getHistory(),
          analysisAPI.getHistory()
        ]);
        if (recsRes.data.success) setRecs(recsRes.data.data);
        if (analysisRes.data.success) setAnalyses(analysisRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Activity History</h2>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'recommendations' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Crop Recommendations ({recs.length})
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'analyses' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('analyses')}
        >
          Plant Analyses ({analyses.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="loader"></div></div>
      ) : activeTab === 'recommendations' ? (
        <div className="space-y-4">
          {recs.length === 0 ? (
            <p className="text-gray-500 bg-gray-50 p-8 rounded-xl text-center">No crop recommendations found.</p>
          ) : (
            recs.map(rec => (
              <div key={rec.id} className="card p-5 hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xl uppercase">
                      {rec.recommended_crop?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 capitalize">{rec.recommended_crop}</h4>
                      <p className="text-sm text-gray-500">{new Date(rec.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4 bg-gray-50 p-3 rounded-lg text-sm">
                  <div><span className="text-gray-500 block text-xs">N</span> <span className="font-medium text-gray-800">{rec.n_content}</span></div>
                  <div><span className="text-gray-500 block text-xs">P</span> <span className="font-medium text-gray-800">{rec.p_content}</span></div>
                  <div><span className="text-gray-500 block text-xs">K</span> <span className="font-medium text-gray-800">{rec.k_content}</span></div>
                  <div><span className="text-gray-500 block text-xs">pH</span> <span className="font-medium text-gray-800">{rec.ph_value}</span></div>
                  <div><span className="text-gray-500 block text-xs">Temp (°C)</span> <span className="font-medium text-gray-800">{rec.temperature}</span></div>
                  <div><span className="text-gray-500 block text-xs">Rain (mm)</span> <span className="font-medium text-gray-800">{rec.rainfall}</span></div>
                </div>
                
                {rec.gemini_details && (
                  <p className="text-sm text-gray-600 border-l-2 border-green-200 pl-3">
                    {rec.gemini_details.substring(0, 150)}...
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analyses.length === 0 ? (
            <p className="col-span-full text-gray-500 bg-gray-50 p-8 rounded-xl text-center">No plant analyses found.</p>
          ) : (
            analyses.map(analysis => (
              <div key={analysis.id} className="card overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
                <div className="h-48 w-full bg-gray-100 flex-shrink-0">
                  <img 
                    src={`http://localhost:5000/${analysis.image_path}`} 
                    alt="Analysis" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x200?text=Image+Unavailable'; }}
                  />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 truncate pr-2" title={analysis.disease_identified}>
                      {analysis.disease_identified !== 'None' ? analysis.disease_identified : 'Healthy Plant'}
                    </h4>
                    <span className={`shrink-0 badge ${analysis.health_status === 'Healthy' ? 'badge-success' : 'badge-error'}`}>
                      {analysis.health_status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{new Date(analysis.created_at).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-auto">
                    {analysis.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default History;
