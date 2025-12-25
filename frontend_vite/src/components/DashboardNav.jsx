import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import tasavurLogo from '../assets/logo.jpg';

/**
 * Dashboard Navigation Component
 * Shared navigation for all dashboard views with role-based links
 */
const DashboardNav = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Role-specific navigation links
  const getNavLinks = () => {
    const commonLinks = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/startups', label: 'Browse Startups' },
      { to: '/resources', label: 'Resources' },
    ];

    const roleLinks = {
      admin: [
        ...commonLinks,
        { to: '/resources/admin/manage', label: 'Manage Resources' },
      ],
      founder: [
        ...commonLinks,
        { to: '/onboard', label: 'Register Startup' },
        { to: '/mentor-request', label: 'Find Mentors' },
        { to: '/funding', label: 'Apply for Funding' },
      ],
      mentor: [
        ...commonLinks,
        { to: '/mentorship/my-requests', label: 'My Sessions' },
      ],
      investor: [
        ...commonLinks,
        { to: '/funding', label: 'Investment Opportunities' },
      ],
    };

    return roleLinks[user?.role] || commonLinks;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <img
              src={tasavurLogo}
              alt="Tasavur"
              className="w-10 h-10 rounded-full shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow object-cover"
            />
            <span className="font-aref text-2xl font-bold gradient-text-colorful">
              Tasavur
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-white/70 hover:text-white transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}

            {/* User Menu */}
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-white/10">
              <div className="text-sm">
                <div className="text-white/60 text-xs">Welcome,</div>
                <div className="text-white font-medium">{user?.name}</div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-accent-orange/20 text-accent-orange border border-accent-orange/30">
                {user?.role}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all border border-white/10 hover:border-white/20"
              >
                Logout
              </button>
            </div>
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
          <div className="md:hidden py-4 border-t border-white/10 animate-fade-in-down">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-white/80 hover:text-white transition-colors px-2 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-white/10">
                <div className="text-white/60 text-sm mb-2">{user?.name} ({user?.role})</div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all border border-white/10"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DashboardNav;
