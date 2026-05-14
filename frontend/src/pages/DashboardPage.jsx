import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Home, Sprout, Camera, Activity,
  History as HistoryIcon, User, LogOut, MessageSquare, TrendingUp
} from 'lucide-react';

// Subcomponents
import DashboardOverview from '../components/DashboardOverview';
import CropRecommendation from '../components/CropRecommendation';
import ImageAnalysis from '../components/ImageAnalysis';
import History from '../components/History';
import CropYieldPrediction from '../components/CropYieldPrediction';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '', icon: <Home className="w-5 h-5" /> },
    { name: 'Crop Suggest', path: 'crop-recommendation', icon: <Sprout className="w-5 h-5" /> },
    { name: 'Yield Prediction', path: 'yield-prediction', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'Health Analysis', path: 'analysis', icon: <Camera className="w-5 h-5" /> },
    { name: 'History', path: 'history', icon: <HistoryIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 flex flex-col p-6`}>
        <div className="flex items-center gap-3 mb-10">
          <img src="/logo.png" alt="Krishi Mitra" className="w-10 h-10 object-contain rounded-full bg-white" />
          <h1 className="text-2xl font-bold text-white tracking-wide">FarmGPT</h1>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <Link to="/dashboard/crop-recommendation" onClick={() => setSidebarOpen(false)} className="btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
            <Sprout className="w-4 h-4" /> New Recommendation
          </Link>
          <Link to="/dashboard/analysis" onClick={() => setSidebarOpen(false)} className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Analyze Plant
          </Link>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2 mt-4">
          {navLinks.map((link) => {
            const isActive = location.pathname === `/dashboard${link.path ? `/${link.path}` : ''}`;
            return (
              <Link
                key={link.name}
                to={`/dashboard${link.path ? `/${link.path}` : ''}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-colors ${isActive ? 'bg-gray-700 text-white font-semibold' : 'hover:bg-gray-700/50'}`}
              >
                <div className={`${isActive ? 'text-primary' : 'text-gray-400'}`}>{link.icon}</div>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-700 pt-4 mt-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white text-red-400 transition-colors">
            <LogOut className="w-5 h-5" /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center h-16 px-6 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 focus:outline-none lg:hidden mr-4">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 capitalize">
              {location.pathname.split('/').pop() === 'dashboard' ? 'Overview' : location.pathname.split('/').pop().replace('-', ' ')}
            </h2>
          </div>

          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="focus:outline-none flex items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold bg-gradient-to-r from-green-400 to-green-600 shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-100 py-1">
                <div className="px-4 py-3 border-b border-gray-100 bg-green-50/50 rounded-t-lg">
                  <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.phone}</p>
                </div>
                <Link to="/profile" className="flex items-center px-4 py-2 hover:bg-green-50 hover:text-primary transition-colors text-sm text-gray-700 mt-1">
                  <User className="w-4 h-4 mr-2" /> Profile Settings
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/yield-prediction" element={<CropYieldPrediction />} />
            <Route path="/analysis" element={<ImageAnalysis />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
