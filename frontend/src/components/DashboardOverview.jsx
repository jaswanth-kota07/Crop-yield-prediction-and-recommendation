import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Bug, Target, ArrowRight } from 'lucide-react';
import { analysisAPI, recommendationsAPI } from '../services/api';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    cropsMonitored: 0,
    diseaseDetections: 0,
    healthyPlants: 0,
    totalRecommendations: 0,
    farmHealthScore: 0
  });
  
  const [recentRecs, setRecentRecs] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recsRes, analysisRes] = await Promise.all([
          analysisAPI.getStats(),
          recommendationsAPI.getHistory(),
          analysisAPI.getHistory()
        ]);
        
        if (statsRes.data.success) setStats(statsRes.data.data);
        if (recsRes.data.success) setRecentRecs(recsRes.data.data.slice(0, 3));
        if (analysisRes.data.success) setRecentAnalyses(analysisRes.data.data.slice(0, 3));
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="loader"></div></div>;
  }

  // Health score color
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <h2 className="text-2xl font-bold text-gray-800">Farm Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Activity className="w-32 h-32 text-blue-900" />
          </div>
          <div className="flex flex-col items-start relative z-10 text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 shadow-inner border border-blue-100/50">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Farm Health Score</p>
            <h3 className={`text-4xl font-extrabold ${getHealthColor(stats.farmHealthScore)}`}>
              {stats.farmHealthScore}%
            </h3>
          </div>
        </div>
        
        <div className="card bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Target className="w-32 h-32 text-purple-900" />
          </div>
          <div className="flex flex-col items-start relative z-10 text-left">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4 shadow-inner border border-purple-100/50">
              <Target className="w-6 h-6" />
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Images Analyzed</p>
            <h3 className="text-4xl font-extrabold text-gray-800 tracking-tight">
              {stats.cropsMonitored}
            </h3>
          </div>
        </div>

        <div className="card bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <ShieldCheck className="w-32 h-32 text-green-900" />
          </div>
          <div className="flex flex-col items-start relative z-10 text-left">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-4 shadow-inner border border-green-100/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Healthy Plants</p>
            <h3 className="text-4xl font-extrabold text-green-600 tracking-tight">
              {stats.healthyPlants}
            </h3>
          </div>
        </div>

        <div className="card bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Bug className="w-32 h-32 text-red-900" />
          </div>
          <div className="flex flex-col items-start relative z-10 text-left">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4 shadow-inner border border-red-100/50">
              <Bug className="w-6 h-6" />
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Disease Found</p>
            <h3 className="text-4xl font-extrabold text-red-600 tracking-tight">
              {stats.diseaseDetections}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Recommendations */}
        <div className="card bg-white p-6 lg:p-8 shadow-sm border border-gray-100 rounded-[2rem]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 border-b border-gray-100 pb-4">
            <div className="text-left">
              <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">Recent Crop Recommendations</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">Your latest personalized suggestions</p>
            </div>
            <Link to="history" className="text-sm text-green-600 hover:text-green-700 font-bold flex items-center mt-3 sm:mt-0 bg-green-50 px-3 py-1.5 rounded-lg transition-colors">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentRecs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-[1.5rem] border border-dashed border-gray-200 text-center">
                <Target className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm font-medium">No recommendations yet.</p>
              </div>
            ) : (
              recentRecs.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition border border-gray-100">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-lg font-bold capitalize">
                      {rec.recommended_crop.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 capitalize leading-tight">{rec.recommended_crop}</h4>
                      <p className="text-xs text-gray-500">
                        {new Date(rec.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">
                    N: {rec.n_content} • P: {rec.p_content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Analysis */}
        <div className="card bg-white p-6 lg:p-8 shadow-sm border border-gray-100 rounded-[2rem]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 border-b border-gray-100 pb-4">
            <div className="text-left">
              <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">Recent Health Scans</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">Latest disease detection results</p>
            </div>
            <Link to="history" className="text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center mt-3 sm:mt-0 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentAnalyses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-[1.5rem] border border-dashed border-gray-200 text-center">
                <Activity className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm font-medium">No analyses yet.</p>
              </div>
            ) : (
              recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="group flex gap-4 p-4 bg-gray-50/50 hover:bg-blue-50/30 border border-gray-100 hover:shadow-sm transition-all rounded-[1.25rem] text-left">
                  <div className="relative shrink-0">
                    <img 
                      src={`http://localhost:5000/${analysis.image_path}`} 
                      alt="Plant" 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-sm bg-gray-100 border border-gray-200"
                      onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                    />
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${analysis.health_status === 'Healthy' ? 'bg-green-500' : 'bg-red-500'}`}>
                       {analysis.health_status === 'Healthy' ? <ShieldCheck className="w-3.5 h-3.5 text-white" /> : <Bug className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1">
                      <h4 className="font-bold text-gray-800 text-base truncate">
                        {analysis.disease_identified !== 'None' ? analysis.disease_identified : 'Healthy Plant'}
                      </h4>
                      <span className={`self-start sm:self-auto text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-widest ${analysis.health_status === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {analysis.health_status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5 pr-2">
                      {analysis.description || 'Scanned for disease and overall health.'}
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-2">
                      {new Date(analysis.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
