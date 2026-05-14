import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import { User, Phone, MapPin, Layers, Save, X, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '', phone: '', location: '', land_acres: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileAPI.get();
        if (res.data.success) {
          setFormData({
            name: res.data.data.name || '',
            phone: res.data.data.phone || '',
            location: res.data.data.location || '',
            land_acres: res.data.data.land_acres || ''
          });
        }
      } catch (err) {
        setMessage({ text: 'Failed to load profile data.', type: 'error' });
      } finally {
        setFetchLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const payload = {
        ...formData,
        phone: formData.phone.startsWith('+91') ? formData.phone : '+91' + formData.phone.replace(/\D/g, '').slice(0, 10)
      };

      const res = await profileAPI.update(payload);
      if (res.data.success) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        // Update user context
        const token = localStorage.getItem('krishi_token');
        login(token, { ...user, ...payload });
      } else {
        setMessage({ text: res.data.errors?.join(', ') || 'Update failed.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Update failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="h-screen flex justify-center items-center"><div className="loader"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm h-16 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Profile Settings</h1>
        </div>
        <img src="/logo.png" alt="Krishi Mitra" className="w-10 h-10 object-contain rounded-full bg-white shadow-sm" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="md:col-span-1">
            <div className="card p-6 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center font-bold text-white text-4xl shadow-md mb-4">
                {formData.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-800">{formData.name}</h2>
              <p className="text-sm text-gray-500 mb-6">FarmGPT Farmer</p>

              <div className="space-y-4 text-left border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-gray-700">{formData.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-gray-700">{formData.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-primary" />
                  <span className="text-gray-700">{formData.land_acres} Acres</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="card p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Edit Information</h3>

              {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> Full Name
                  </label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> Phone Number
                  </label>
                  <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="input" required />
                  <p className="text-xs text-gray-500 mt-1">10-digit phone number</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> Location
                  </label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="input" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" /> Land Area (Acres)
                  </label>
                  <input type="number" step="0.1" min="0.1" name="land_acres" value={formData.land_acres} onChange={handleChange} className="input" required />
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-4">
                  <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
                  </button>
                  <Link to="/dashboard" className="btn btn-outline flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
