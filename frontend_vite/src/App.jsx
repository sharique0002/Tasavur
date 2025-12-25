import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState, useRef, useCallback } from 'react';
import React from 'react';
import Onboard from './pages/Onboard';
import Dashboard from './pages/Dashboard';
import RoleDashboard from './pages/RoleDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FounderDashboard from './pages/FounderDashboard';
import MentorDashboard from './pages/MentorDashboard';
import InvestorDashboard from './pages/InvestorDashboard';
import MentorRequest from './pages/MentorRequest';
import MyRequests from './pages/MyRequests';
import ResourceHub from './pages/ResourceHub';
import ResourceManagement from './pages/ResourceManagement';
import FundingApplication from './pages/FundingApplication';
import MyApplications from './pages/MyApplications';
import LaunchAnimation from './components/LaunchAnimation';
import StartupDetails from './pages/StartupDetails';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import useAuthStore from './store/authStore';
import tasavurLogo from './assets/logo.jpg';


// =============================================================================
// SCROLL REVEAL HOOK
// =============================================================================
const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
};

// =============================================================================
// PROTECTED & PUBLIC ROUTE COMPONENTS
// =============================================================================

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children, redirectIfAuth = false }) => {
  const { isAuthenticated, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (redirectIfAuth && isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
};

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

function App() {
  const { initialize, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-[#0a0a0a]">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(17, 17, 17, 0.9)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              borderRadius: '1rem',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <PublicRoute redirectIfAuth>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute redirectIfAuth>
                <Register />
              </PublicRoute>
            }
          />
          <Route path="/onboard" element={<Onboard />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/startups"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentor-request"
            element={
              <ProtectedRoute roles={['founder', 'admin']}>
                <MentorRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentors"
            element={
              <ProtectedRoute roles={['founder', 'admin']}>
                <MentorRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funding"
            element={
              <ProtectedRoute roles={['founder', 'admin']}>
                <FundingApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-applications"
            element={
              <ProtectedRoute roles={['founder', 'admin']}>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentorship/my-requests"
            element={
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentorship/requests/:id"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Request Details" />
              </ProtectedRoute>
            }
          />
          <Route path="/resources" element={<ResourceHub />} />
          <Route path="/resources/:id" element={<PlaceholderPage title="Resource Details" />} />
          <Route
            path="/resources/admin/manage"
            element={
              <ProtectedRoute roles={['admin', 'mentor']}>
                <ResourceManagement />
              </ProtectedRoute>
            }
          />
          <Route path="/startups/:id" element={<StartupDetails />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={['admin']}>
                <PlaceholderPage title="Admin Panel" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Profile Settings" />
              </ProtectedRoute>
            }
          />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

// =============================================================================
// NAVIGATION COMPONENT
// =============================================================================

const Navigation = ({ isScrolled }) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    // Redirect to home page after logout
    window.location.href = '/';
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
        ? 'bg-black/80 backdrop-blur-xl border-b border-white/10'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src={tasavurLogo}
              alt="Tasavur"
              className="w-14 h-14 rounded-full shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow object-cover"
            />
            <span className="font-aref text-3xl font-bold gradient-text-colorful">Tasavur</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/resources" className="nav-link">Resources</Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-white/60 text-sm">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm py-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="btn btn-ghost text-sm py-2">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary text-sm py-2">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-white/10 animate-fade-in-down">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
              <Link to="/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</Link>
              <Link to="/resources" className="text-white/80 hover:text-white transition-colors">Resources</Link>
              {!isAuthenticated && (
                <>
                  <Link to="/login" className="btn btn-ghost text-center">Login</Link>
                  <Link to="/register" className="btn btn-primary text-center">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// =============================================================================
// HOME/LANDING PAGE
// =============================================================================

const Home = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  useScrollReveal();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      <Navigation isScrolled={isScrolled} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center gradient-hero pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-orange/20 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[120px] animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-purple/5 rounded-full blur-[150px]"></div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          ></div>

          {/* Floating Animated Icons */}
          <div className="absolute top-[15%] left-[10%] text-5xl opacity-20 animate-float" style={{ animationDelay: '0s' }}>🚀</div>
          <div className="absolute top-[25%] right-[15%] text-4xl opacity-15 animate-float" style={{ animationDelay: '1s' }}>💡</div>
          <div className="absolute bottom-[30%] left-[8%] text-4xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>📊</div>
          <div className="absolute top-[40%] right-[8%] text-5xl opacity-15 animate-float" style={{ animationDelay: '0.5s' }}>💰</div>
          <div className="absolute bottom-[20%] right-[12%] text-4xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}>🎯</div>
          <div className="absolute top-[60%] left-[12%] text-4xl opacity-15 animate-float" style={{ animationDelay: '2.5s' }}>⚡</div>
          <div className="absolute top-[20%] left-[40%] text-3xl opacity-10 animate-float" style={{ animationDelay: '3s' }}>🌟</div>
          <div className="absolute bottom-[40%] right-[35%] text-3xl opacity-10 animate-float" style={{ animationDelay: '3.5s' }}>📈</div>

          {/* Floating Geometric Shapes */}
          <div className="absolute top-[30%] left-[20%] w-4 h-4 border-2 border-accent-orange/30 rounded-full animate-float" style={{ animationDelay: '0.7s' }}></div>
          <div className="absolute top-[50%] right-[20%] w-6 h-6 border-2 border-accent-cyan/30 rotate-45 animate-float" style={{ animationDelay: '1.2s' }}></div>
          <div className="absolute bottom-[25%] left-[25%] w-3 h-3 bg-accent-purple/20 rounded-full animate-float" style={{ animationDelay: '1.8s' }}></div>
          <div className="absolute top-[45%] left-[5%] w-5 h-5 border-2 border-white/10 rounded-lg rotate-12 animate-float" style={{ animationDelay: '2.2s' }}></div>
          <div className="absolute bottom-[35%] right-[25%] w-4 h-4 border-2 border-accent-orange/20 rounded-full animate-float" style={{ animationDelay: '2.7s' }}></div>

          {/* Line Decorations */}
          <div className="absolute top-[35%] right-[5%] w-20 h-[2px] bg-gradient-to-r from-transparent via-accent-orange/20 to-transparent rotate-45 animate-pulse"></div>
          <div className="absolute bottom-[45%] left-[5%] w-16 h-[2px] bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent -rotate-45 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="animate-fade-in-up">
            <span className="inline-block px-5 py-2.5 mb-8 text-sm font-medium text-accent-orange bg-accent-orange/10 rounded-full border border-accent-orange/20 shadow-lg shadow-accent-orange/10">
              🚀 Launch Your Startup Journey
            </span>
          </div>

          <h1 className="hero-title animate-fade-in-up animation-delay-100">
            <span className="gradient-text-warm">Where Every Idea Has a Future</span>
          </h1>

          <p className="hero-subtitle mx-auto mt-8 animate-fade-in-up animation-delay-200">
            Connect with world-class mentors, access premium resources, and transform your startup into the next success story.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mt-12 animate-fade-in-up animation-delay-300">
            <Link
              to="/onboard"
              className="btn btn-primary text-lg px-8 py-4 shadow-lg shadow-accent-orange/30"
            >
              Register Your Startup
              <svg className="inline-block ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/resources"
              className="btn btn-secondary text-lg px-8 py-4"
            >
              Explore Resources
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-8 mt-20 animate-fade-in-up animation-delay-400">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text">500+</div>
              <div className="text-white/50 mt-2">Startups Launched</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text">150+</div>
              <div className="text-white/50 mt-2">Expert Mentors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text">$50M+</div>
              <div className="text-white/50 mt-2">Funding Raised</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce-slow">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* ====== LAUNCH CEREMONY SECTION ====== */}
      <section id="launch-ceremony" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 reveal">
            <h2 className="text-3xl md:text-5xl font-bold text-white font-display mb-4">
              Ready to <span className="gradient-text">Begin?</span>
            </h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Click the button below to initiate your startup journey with our ceremonial launch sequence
            </p>
          </div>

          <div className="reveal">
            <LaunchAnimation />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 reveal">
            <h2 className="text-4xl md:text-6xl font-bold text-white font-display mb-6">
              Why Choose <span className="gradient-text">Tasavur</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Everything you need to transform your idea into a thriving business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-children" id="features">
            <div className="feature-card group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-orange/20 to-accent-orange/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Expert Mentorship</h3>
              <p className="text-white/60 leading-relaxed">
                Get matched with industry veterans who have built and scaled successful companies. Learn from their experiences and avoid common pitfalls.
              </p>
            </div>

            <div className="feature-card group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Resource Library</h3>
              <p className="text-white/60 leading-relaxed">
                Access curated templates, courses, and tools. From pitch decks to financial models, we've got everything you need.
              </p>
            </div>

            <div className="feature-card group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-purple/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Funding Support</h3>
              <p className="text-white/60 leading-relaxed">
                Connect with our network of investors and apply for funding opportunities. We help you prepare and pitch effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center reveal">
          <h2 className="text-4xl md:text-6xl font-bold text-white font-display mb-6">
            Ready to Build the <span className="gradient-text-warm">Future</span>?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Join thousands of founders who are already building their dreams with Tasavur.
          </p>
          <Link
            to="/register"
            className="btn btn-primary text-xl px-10 py-5 inline-flex items-center gap-3"
          >
            Get Started Now
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <img src={tasavurLogo} alt="Tasavur" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <span className="font-aref text-2xl font-bold gradient-text-colorful">Tasavur</span>
                <p className="text-white/40 text-xs">Where Every Idea Has a Future</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-white/50 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <div className="text-white/40 text-sm">
              © 2024 Tasavur. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// =============================================================================
// LOGIN PAGE
// =============================================================================

const Login = () => {
  const { login, loading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-accent-orange/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-3 mb-6">
              <img
                src={tasavurLogo}
                alt="Tasavur"
                className="w-12 h-12 rounded-xl shadow-lg shadow-purple-500/30 object-cover"
              />
            </Link>
            <h2 className="text-3xl font-bold text-white font-display">Welcome Back</h2>
            <p className="text-white/50 mt-2">Sign in to continue your journey</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fade-in">
              {error}
              <button onClick={clearError} className="float-right text-red-400 hover:text-red-300">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'email' ? 'text-accent-orange' : 'text-white/70'}`}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="input input-glow"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'password' ? 'text-accent-orange' : 'text-white/70'}`}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="input input-glow"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3.5 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/forgot-password" className="text-white/50 hover:text-white text-sm transition-colors">
              Forgot password?
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/50">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent-orange hover:text-orange-400 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// REGISTER PAGE
// =============================================================================

const Register = () => {
  const { register, loading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'founder',
  });
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(formData);
    if (result.success) {
      window.location.href = '/onboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-orange/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-3 mb-6">
              <img
                src={tasavurLogo}
                alt="Tasavur"
                className="w-12 h-12 rounded-xl shadow-lg shadow-purple-500/30 object-cover"
              />
            </Link>
            <h2 className="text-3xl font-bold text-white font-display">Create Account</h2>
            <p className="text-white/50 mt-2">Start your entrepreneurial journey</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fade-in">
              {error}
              <button onClick={clearError} className="float-right text-red-400 hover:text-red-300">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'name' ? 'text-accent-orange' : 'text-white/70'}`}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                className="input input-glow"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'email' ? 'text-accent-orange' : 'text-white/70'}`}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="input input-glow"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'password' ? 'text-accent-orange' : 'text-white/70'}`}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="input input-glow"
                placeholder="Min. 6 characters"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'role' ? 'text-accent-orange' : 'text-white/70'}`}>
                I am a
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                onFocus={() => setFocusedField('role')}
                onBlur={() => setFocusedField(null)}
                className="input input-glow cursor-pointer"
              >
                <option value="founder" className="bg-dark-900">Startup Founder</option>
                <option value="mentor" className="bg-dark-900">Mentor</option>
                <option value="investor" className="bg-dark-900">Investor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3.5 text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/50">
              Already have an account?{' '}
              <Link to="/login" className="text-accent-orange hover:text-orange-400 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PLACEHOLDER PAGE
// =============================================================================

const PlaceholderPage = ({ title }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-orange/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="text-center max-w-md px-6 relative z-10 animate-fade-in-up">
        <div className="text-8xl mb-8">🚧</div>
        <h1 className="text-4xl font-bold text-white font-display mb-4">{title}</h1>
        <p className="text-white/60 mb-10 text-lg">
          This page is coming soon. We're working hard to bring you this feature.
        </p>
        <Link
          to="/"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

// =============================================================================
// 404 NOT FOUND PAGE
// =============================================================================

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh"></div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-accent-orange/20 rounded-full blur-[150px] animate-float"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent-cyan/20 rounded-full blur-[150px] animate-float-delayed"></div>
      </div>

      <div className="text-center text-white relative z-10 animate-scale-in">
        <h1 className="text-[12rem] font-black leading-none gradient-text text-shadow mb-4">
          404
        </h1>
        <p className="text-3xl text-white/80 mb-10 font-display">Page not found</p>
        <Link
          to="/"
          className="btn btn-primary text-lg px-8 py-4 inline-flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default App;
