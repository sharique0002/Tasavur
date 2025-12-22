import { useState, useEffect, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserGroupIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { startupAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';
import StartupCard from '../components/StartupCard';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import AdminControls from '../components/AdminControls';
import io from 'socket.io-client';

/**
 * Dashboard Page
 * Main dashboard showing startups with filters, search, and pagination
 * Dark theme with glassmorphism effects
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    domain: '',
    stage: '',
    status: '',
    search: '',
  });

  // Selected startups for bulk actions
  const [selectedStartups, setSelectedStartups] = useState([]);

  // Modal state for startup details
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Socket.IO for real-time updates
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');

    socket.on('connect', () => {
      // Connected to real-time updates
    });

    socket.on('startup:updated', (data) => {
      fetchStartups();
      toast.success('Dashboard updated with latest data');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch startups
  const fetchStartups = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        ...filters,
      };

      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const response = await startupAPI.getAll(params);
      setStartups(response.data.data);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.count);
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg);
      console.error('Error fetching startups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, [currentPage, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setSelectedStartups([]);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedStartups([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStartup = (startupId) => {
    setSelectedStartups((prev) =>
      prev.includes(startupId)
        ? prev.filter((id) => id !== startupId)
        : [...prev, startupId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStartups.length === startups.length) {
      setSelectedStartups([]);
    } else {
      setSelectedStartups(startups.map((s) => s._id));
    }
  };

  const handleBulkActionComplete = () => {
    setSelectedStartups([]);
    fetchStartups();
  };

  const handleStartupClick = (startup) => {
    setSelectedStartup(startup);
    setShowDetailModal(true);
  };

  const handleRequestMentor = () => {
    setShowDetailModal(false);
    navigate('/mentors', { state: { startup: selectedStartup } });
  };

  const handleApplyFunding = () => {
    setShowDetailModal(false);
    navigate('/funding', { state: { startup: selectedStartup } });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-3 group">
                <img
                  src="/src/assets/logo.jpg"
                  alt="Tasavur"
                  className="w-14 h-14 rounded-full shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow object-cover"
                />
                <span className="font-aref text-3xl font-bold gradient-text-colorful hidden sm:block">Tasavur</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated && user?.role === 'founder' && (
                <>
                  <button
                    onClick={() => navigate('/my-applications')}
                    className="btn btn-secondary text-sm"
                  >
                    💰 My Applications
                  </button>
                  <button
                    onClick={() => navigate('/onboard')}
                    className="btn btn-primary text-sm"
                  >
                    + Add Startup
                  </button>
                </>
              )}
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-white/60 text-sm hidden sm:block">{user?.name}</span>
                  <button
                    onClick={logout}
                    className="btn btn-secondary text-sm py-2"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-ghost text-sm py-2"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="btn btn-primary text-sm py-2"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-orange/10 rounded-full blur-[150px]"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[150px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white font-display">
                Dashboard
              </h1>
              <p className="text-white/60 mt-2 text-lg">
                {isAuthenticated ? `Welcome back, ${user?.name}!` : 'Explore startups in our incubator'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard
            title="Total Startups"
            value={totalCount}
            icon="🚀"
            gradient="from-blue-500/20 to-blue-500/5"
          />
          <StatCard
            title="Active"
            value={startups.filter((s) => s.status === 'Active').length}
            icon="✅"
            gradient="from-green-500/20 to-green-500/5"
          />
          <StatCard
            title="Pending"
            value={startups.filter((s) => s.status === 'Pending').length}
            icon="⏳"
            gradient="from-yellow-500/20 to-yellow-500/5"
          />
          <StatCard
            title="This Page"
            value={startups.length}
            icon="📄"
            gradient="from-purple-500/20 to-purple-500/5"
          />
        </div>

        {/* Filter Bar */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        {/* Admin Controls */}
        {user?.role === 'admin' && selectedStartups.length > 0 && (
          <AdminControls
            selectedCount={selectedStartups.length}
            selectedStartups={selectedStartups}
            onActionComplete={handleBulkActionComplete}
            onSelectAll={handleSelectAll}
            allSelected={selectedStartups.length === startups.length}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="spinner w-12 h-12"></div>
          </div>
        )}

        {/* Startups Grid */}
        {!loading && startups.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {startups.map((startup, index) => (
                <div
                  key={startup._id}
                  onClick={() => handleStartupClick(startup)}
                  className="cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <StartupCard
                    startup={startup}
                    isSelected={selectedStartups.includes(startup._id)}
                    onSelect={
                      user?.role === 'admin'
                        ? (e) => {
                          e.stopPropagation();
                          handleSelectStartup(startup._id);
                        }
                        : null
                    }
                    showActions={isAuthenticated}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* Empty State */}
        {!loading && startups.length === 0 && (
          <div className="text-center py-32">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-5xl">🔍</span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              No startups found
            </h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Try adjusting your filters or search query to find what you're looking for
            </p>
            <button
              onClick={() => handleFilterChange({ domain: '', stage: '', status: '', search: '' })}
              className="btn btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Startup Detail Modal */}
        <Transition appear show={showDetailModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowDetailModal(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl glass-card p-8 text-left shadow-2xl transition-all">
                    {selectedStartup && (
                      <>
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <Dialog.Title as="h3" className="text-3xl font-bold text-white font-display">
                              {selectedStartup.name}
                            </Dialog.Title>
                            <p className="text-white/60 mt-2">{selectedStartup.shortDesc}</p>
                          </div>
                          <button
                            onClick={() => setShowDetailModal(false)}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4">
                              <span className="text-sm text-white/50">Domain</span>
                              <p className="mt-1 text-white font-medium">{selectedStartup.domain}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                              <span className="text-sm text-white/50">Stage</span>
                              <p className="mt-1 text-white font-medium">{selectedStartup.stage}</p>
                            </div>
                          </div>

                          {selectedStartup.founders && selectedStartup.founders.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                                <UserGroupIcon className="h-5 w-5 mr-2 text-white/50" />
                                Founders
                              </h4>
                              <div className="space-y-3">
                                {selectedStartup.founders.map((founder, idx) => (
                                  <div key={idx} className="flex items-center space-x-3 bg-white/5 rounded-xl p-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-orange/30 to-accent-orange/10 flex items-center justify-center">
                                      <span className="text-accent-orange font-semibold">
                                        {founder.name?.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-white">{founder.name}</p>
                                      <p className="text-white/50 text-sm">{founder.email}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedStartup.kpis && (
                            <div>
                              <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                                <ChartBarIcon className="h-5 w-5 mr-2 text-white/50" />
                                Key Metrics
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {selectedStartup.kpis.revenue && (
                                  <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-4 border border-green-500/20">
                                    <span className="text-xs text-white/50">Revenue</span>
                                    <p className="text-2xl font-bold text-green-400 mt-1">
                                      ${selectedStartup.kpis.revenue?.toLocaleString()}
                                    </p>
                                  </div>
                                )}
                                {selectedStartup.kpis.users && (
                                  <div className="bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl p-4 border border-blue-500/20">
                                    <span className="text-xs text-white/50">Users</span>
                                    <p className="text-2xl font-bold text-blue-400 mt-1">
                                      {selectedStartup.kpis.users?.toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedStartup.pitchDeckUrl && (
                            <div>
                              <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                                <DocumentTextIcon className="h-5 w-5 mr-2 text-white/50" />
                                Pitch Deck
                              </h4>
                              <a
                                href={selectedStartup.pitchDeckUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-accent-orange hover:text-orange-400 transition-colors"
                              >
                                View Pitch Deck
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}

                          <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                            <button
                              onClick={handleRequestMentor}
                              className="btn btn-secondary"
                            >
                              Request Mentor
                            </button>
                            <button
                              onClick={handleApplyFunding}
                              className="btn btn-primary"
                            >
                              Apply for Funding
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 * Dark themed stat display with gradient icon background
 */
const StatCard = ({ title, value, icon, gradient }) => {
  return (
    <div className="stat-card group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/50 mb-1">{title}</p>
          <p className="text-3xl md:text-4xl font-bold text-white">{value}</p>
        </div>
        <div className={`text-4xl w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
