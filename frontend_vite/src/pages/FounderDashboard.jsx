import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  RocketLaunchIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { startupAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';
import DashboardNav from '../components/DashboardNav';

/**
 * Founder Dashboard
 * For startup founders to manage their startups and resources
 */
const FounderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [myStartups, setMyStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyStartups();
  }, []);

  const fetchMyStartups = async () => {
    try {
      setLoading(true);
      const response = await startupAPI.getAll({ page: 1, limit: 10 });
      // Filter startups created by this user
      const userStartups = response.data.data.filter(
        s => s.createdBy === user?.id || s.createdBy?._id === user?.id
      );
      setMyStartups(userStartups);
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNav />
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-display">
            Founder Dashboard
          </h1>
          <p className="text-white/60">Welcome back, {user?.name}! Manage your startup journey.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <RocketLaunchIcon className="w-8 h-8 text-accent-orange mb-3" />
            <h3 className="text-white/60 text-sm mb-1">My Startups</h3>
            <p className="text-3xl font-bold text-white">{myStartups.length}</p>
          </div>
          
          <div className="glass-card p-6">
            <UserGroupIcon className="w-8 h-8 text-accent-purple mb-3" />
            <h3 className="text-white/60 text-sm mb-1">Mentorship Sessions</h3>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
          
          <div className="glass-card p-6">
            <CurrencyDollarIcon className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-white/60 text-sm mb-1">Funding Applications</h3>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to="/onboard"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl w-fit mb-4">
              <PlusIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Register Startup</h3>
            <p className="text-white/60 text-sm">Add your startup to the platform</p>
          </Link>

          <Link
            to="/mentor-request"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl w-fit mb-4">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Find Mentor</h3>
            <p className="text-white/60 text-sm">Get matched with experienced mentors</p>
          </Link>

          <Link
            to="/funding-application"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl w-fit mb-4">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Apply for Funding</h3>
            <p className="text-white/60 text-sm">Submit funding applications</p>
          </Link>

          <Link
            to="/resources"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl w-fit mb-4">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Resources</h3>
            <p className="text-white/60 text-sm">Access learning materials</p>
          </Link>
        </div>

        {/* My Startups */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">My Startups</h2>
            <Link to="/onboard" className="btn btn-primary text-sm">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Startup
            </Link>
          </div>

          {myStartups.length === 0 ? (
            <div className="text-center py-12">
              <RocketLaunchIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Startups Yet</h3>
              <p className="text-white/60 mb-6">Start your journey by registering your first startup</p>
              <Link to="/onboard" className="btn btn-primary">
                Register Your Startup
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myStartups.map((startup) => (
                <div
                  key={startup._id}
                  className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/startups/${startup._id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-white font-bold text-lg">{startup.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      startup.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                      startup.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {startup.status}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">{startup.shortDesc}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-accent-orange">{startup.domain}</span>
                    <span className="text-white/60">{startup.stage}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FounderDashboard;
