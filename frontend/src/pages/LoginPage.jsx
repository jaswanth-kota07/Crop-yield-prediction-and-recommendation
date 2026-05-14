import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Phone, Loader2, ChevronDown } from 'lucide-react';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authAPI.login(phone);
      if (res.data.status === 'success') {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay to ensure text readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-0"></div>

      {/* Remove harsh black overlay, keep it natural to match image */}

      {/* Language Selector Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <button className="bg-white/80 hover:bg-white backdrop-blur-md px-4 py-2 rounded-lg text-gray-700 font-medium flex items-center gap-2 shadow-sm transition-all border border-white/50">
          Language <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-[450px] relative z-10">
        <div className="bg-white/40 backdrop-blur-md py-10 px-6 sm:px-10 shadow-2xl sm:rounded-2xl border border-white/40">

          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="Krishi Mitra" className="w-20 h-20 object-contain mb-2" />

            <h2 className="mt-2 text-center text-3xl font-bold">
              <span className="text-green-600">FarmGPT</span> <span className="text-gray-800">Login</span>
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 font-medium">
              Welcome back! Please enter your mobile number.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 w-14 flex items-center justify-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter your 10-digit mobile number"
                  style={{ paddingLeft: '3.5rem' }}
                  className="block w-full pr-3 h-14 border border-white/40 rounded-lg text-gray-800 placeholder-gray-500 bg-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-base font-medium"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full flex items-center justify-center h-14 px-4 rounded-lg shadow-lg text-lg font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-700 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-green-600 hover:text-green-700">
              Register here
            </Link>
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center px-4 z-10">
        <p className="text-sm text-white/90 font-medium drop-shadow-md">
          © 2026 FarmGPT. Empowering farmers with technology.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
