import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Shield, Cpu, CloudRain, ArrowRight, Zap, TrendingUp, Users } from 'lucide-react';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #d1f4e8 0%, #b8ede2 50%, #9fe8dc 100%)' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        {/* Light gradient circles */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-green-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70"></div>
        <div className="absolute top-40 -right-20 w-72 h-72 bg-emerald-100/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-70"></div>
        <div className="absolute -bottom-20 left-40 w-64 h-64 bg-green-100/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-70"></div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 py-4 border-b border-white/20 backdrop-blur-sm" style={{ background: 'rgba(255, 255, 255, 0.7)' }}>
        <div className="container flex items-center justify-between mx-auto px-4">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <img src="/logo.png" alt="Krishi Mitra" className="w-10 h-10 object-contain" />
            <span className="text-lg font-bold text-emerald-700 tracking-wide">FarmGPT</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
            <a href="#features" className="hover:text-emerald-600 transition-colors duration-300">Features</a>
            <a href="#stats" className="hover:text-emerald-600 transition-colors duration-300">Dashboard</a>
            <a href="#about" className="hover:text-emerald-600 transition-colors duration-300">Marketplace</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">Login</Link>
            <Link to="/register" className="bg-emerald-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-emerald-700 transition-colors shadow-md">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-16 pb-20 relative z-10">
        <div
          className={`flex flex-col items-center max-w-5xl mx-auto transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/40 backdrop-blur text-emerald-700 font-medium text-sm">
            <Zap className="w-4 h-4" />
            Precision agriculture, powered by AI insight
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight text-center">
            <span className="text-emerald-800">From Soil to Success</span><br />
            <span className="text-emerald-600">Made Easy</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-10 leading-relaxed text-center">
            Empower your farm with AI technology. Get smart recommendations, monitor crops in real-time, and increase your harvest with data-driven insights.
          </p>

          <Link to="/register" className="bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-700 transition-colors shadow-lg inline-flex items-center gap-2">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Stats Grid */}
          <div id="stats" className="grid grid-cols-3 gap-6 sm:gap-12 w-full max-w-3xl mt-20 pt-16 border-t-2 border-white/40">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-1">50,000</div>
              <div className="text-sm text-gray-700 font-medium">Farmers Helped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-1">95%</div>
              <div className="text-sm text-gray-700 font-medium">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-1">30%+</div>
              <div className="text-sm text-gray-700 font-medium">Yield Increase</div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div id="features" className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="group bg-white/50 backdrop-blur p-8 rounded-2xl text-left border border-white/40 hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition-transform duration-300">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900 mb-3">Smart Crop System</h3>
            <p className="text-gray-700 leading-relaxed text-sm">ML-powered recommendations analyzing soil NPK levels, pH, rainfall, and weather patterns to maximize yield.</p>
          </div>

          <div className="group bg-white/50 backdrop-blur p-8 rounded-2xl text-left border border-white/40 hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900 mb-3">Disease Detection</h3>
            <p className="text-gray-700 leading-relaxed text-sm">Snap a photo of your crop and instantly identify diseases with AI vision, plus get verified treatment recommendations.</p>
          </div>

          <div className="group bg-white/50 backdrop-blur p-8 rounded-2xl text-left border border-white/40 hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-5 group-hover:scale-110 transition-transform duration-300">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900 mb-3">AI Chatbot</h3>
            <p className="text-gray-700 leading-relaxed text-sm">Get instant answers to agricultural questions from our 24/7 AI assistant, trained on expert farming knowledge.</p>
          </div>

          <div className="group bg-white/50 backdrop-blur p-8 rounded-2xl text-left border border-white/40 hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 mb-5 group-hover:scale-110 transition-transform duration-300">
              <CloudRain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900 mb-3">Weather & Insights</h3>
            <p className="text-gray-700 leading-relaxed text-sm">Real-time weather forecasts, soil moisture tracking, and seasonal insights tailored to your exact location.</p>
          </div>
        </div>

        {/* Additional Features */}
        <div id="about" className={`mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-emerald-900 mb-6">Why Choose FarmGPT?</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mt-1">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900 mb-1">Increase Yield by 30%</h3>
                  <p className="text-gray-700">Data-driven decisions backed by machine learning predictions</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mt-1">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900 mb-1">Early Disease Detection</h3>
                  <p className="text-gray-700">Catch problems before they spread across your crops</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mt-1">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900 mb-1">Community Support</h3>
                  <p className="text-gray-700">Connect with thousands of farmers and expert advisors</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/50 backdrop-blur p-8 rounded-2xl border border-white/40">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-8 h-80 flex items-center justify-center border border-emerald-200">
              <div className="text-center">
                <Leaf className="w-20 h-20 text-emerald-600 mx-auto mb-4 opacity-70" />
                <p className="text-emerald-800 font-semibold">Your farming dashboard awaits</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`mt-20 text-center transition-all duration-1000 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-white/50 backdrop-blur p-12 rounded-2xl border border-white/40 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-emerald-900 mb-4">Ready to Transform Your Farm?</h3>
            <p className="text-gray-700 mb-8">Join thousands of farmers already using FarmGPT to maximize their harvests and minimize losses.</p>
            <Link to="/register" className="bg-emerald-600 text-white px-10 py-3 rounded-full font-semibold hover:bg-emerald-700 transition-colors shadow-md inline-flex items-center gap-2">
              Start Your Free Trial Today
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 py-8 px-4 relative z-10" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between text-gray-700 text-sm">
          <p>&copy; 2026 FarmGPT. All rights reserved.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-emerald-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
