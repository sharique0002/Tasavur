import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fundingAPI } from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * MyApplications Page
 * View and manage funding applications
 */
const MyApplications = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view applications');
      navigate('/login');
      return;
    }
    fetchApplications();
  }, [isAuthenticated, navigate]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fundingAPI.getAll();
      setApplications(response.data.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;

    try {
      await fundingAPI.withdraw(id, 'User requested withdrawal');
      toast.success('Application withdrawn');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to withdraw application');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      Submitted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Under Review': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      Approved: 'bg-green-500/20 text-green-300 border-green-500/30',
      Rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
      Withdrawn: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <img
                src="/src/assets/logo.jpg"
                alt="Tasavur"
                className="w-10 h-10 rounded-full shadow-lg shadow-purple-500/30"
              />
              <span className="font-aref text-2xl font-bold gradient-text-colorful">Tasavur</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-400 hover:text-white transition">
                Dashboard
              </Link>
              <span className="text-white/60 text-sm">{user?.name}</span>
              <button onClick={logout} className="btn btn-secondary text-sm py-2">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              💰 My Funding Applications
            </h1>
            <p className="text-gray-400">
              Track and manage your funding applications
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-primary">
            + New Application
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Withdrawn'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status === 'all' ? 'All' : status}
              {status !== 'all' && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {applications.filter(a => a.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No applications found</h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all'
                ? "You haven't submitted any funding applications yet."
                : `No applications with status "${filter}".`}
            </p>
            <Link to="/dashboard" className="btn btn-primary">
              Apply for Funding
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app._id}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-orange-500/30 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left side */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {app.startup?.name || 'Unknown Startup'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="text-orange-400">💵</span>
                        {formatCurrency(app.amountRequested, app.currency)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-purple-400">🎯</span>
                        {app.roundType}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-blue-400">📅</span>
                        {formatDate(app.createdAt)}
                      </span>
                      {app.startup?.domain && (
                        <span className="flex items-center gap-1">
                          <span className="text-green-400">🏷️</span>
                          {app.startup.domain}
                        </span>
                      )}
                    </div>
                    {app.purpose && (
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                        {app.purpose}
                      </p>
                    )}
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center gap-2">
                    {app.status === 'Approved' && app.amountApproved > 0 && (
                      <div className="text-right mr-4">
                        <div className="text-xs text-gray-400">Approved Amount</div>
                        <div className="text-lg font-bold text-green-400">
                          {formatCurrency(app.amountApproved, app.currency)}
                        </div>
                      </div>
                    )}
                    
                    {app.status === 'Draft' && (
                      <button
                        onClick={() => navigate('/funding', { state: { startup: app.startup, applicationId: app._id } })}
                        className="btn btn-secondary text-sm"
                      >
                        Edit
                      </button>
                    )}
                    
                    {['Draft', 'Submitted', 'Under Review'].includes(app.status) && (
                      <button
                        onClick={() => handleWithdraw(app._id)}
                        className="btn bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar for under review */}
                {app.status === 'Under Review' && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Application under review</span>
                      <span>Estimated: 5-7 business days</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full animate-pulse"
                        style={{ width: '60%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {applications.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{applications.length}</div>
              <div className="text-sm text-gray-400">Total Applications</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {applications.filter(a => a.status === 'Approved').length}
              </div>
              <div className="text-sm text-gray-400">Approved</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {applications.filter(a => ['Submitted', 'Under Review'].includes(a.status)).length}
              </div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {formatCurrency(
                  applications.reduce((sum, a) => sum + (a.amountRequested || 0), 0),
                  'USD'
                )}
              </div>
              <div className="text-sm text-gray-400">Total Requested</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyApplications;
