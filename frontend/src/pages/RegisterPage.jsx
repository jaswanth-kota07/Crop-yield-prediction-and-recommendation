import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Phone, User, MapPin, Layers, ArrowRight, Loader2, Mic } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    land_acres: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await authAPI.register(formData);
      if (res.data.status === 'success') {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(res.data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    setLocationLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            if (data && data.display_name) {
              setFormData({ ...formData, location: data.display_name });
            } else {
              setError("Could not parse location name.");
            }
          } catch (e) {
            setError("Error fetching location data.");
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          setError("Location access denied or unavailable.");
          setLocationLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported by your browser.");
      setLocationLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="Krishi Mitra" className="w-20 h-20 object-contain" />
        </div>
        <h2 className="text-center text-4xl font-extrabold text-white tracking-tight">
          Join FarmGPT
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-light hover:text-primary transition-colors">
            Login here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">

          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm flex items-center">
              {success}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Full Name</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input required name="name" type="text" value={formData.name} onChange={handleChange}
                  className="input pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-primary-light" placeholder="Enter your name" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Phone Number</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input required name="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="input pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-primary-light" placeholder="10-digit number" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Location</label>
              <div className="relative rounded-md shadow-sm flex items-center gap-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input required name="location" type="text" value={formData.location} onChange={handleChange}
                    className="input pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-primary-light" placeholder="Your farm location" />
                </div>
                <button type="button" onClick={detectLocation} disabled={locationLoading} className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 px-3 py-3 rounded-md min-w-[50px] flex justify-center">
                  {locationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Land Owned (Acres)</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Layers className="h-5 w-5 text-gray-400" />
                </div>
                <input required name="land_acres" type="number" step="0.01" min="0" value={formData.land_acres} onChange={handleChange}
                  className="input pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-primary-light" placeholder="e.g., 5.5" />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50">
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Register Farm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
