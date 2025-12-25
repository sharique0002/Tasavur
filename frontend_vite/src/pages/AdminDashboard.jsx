import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  RocketLaunchIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { startupAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';
import DashboardNav from '../components/DashboardNav';

/**
 * Admin Dashboard
 * Full control panel with statistics, user management, and startup oversight
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalStartups: 0,
    totalUsers: 0,
    pendingApprovals: 0,
    activeStartups: 0,
    totalFunding: 0,
  });
  const [recentStartups, setRecentStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await startupAPI.getAll({ page: 1, limit: 5 });
      setRecentStartups(response.data.data);
      
      // Calculate stats
      setStats({
        totalStartups: response.data.pagination?.total || 0,
        totalUsers: 156, // Mock data - implement actual API call
        pendingApprovals: response.data.data.filter(s => s.status === 'Pending').length,
        activeStartups: response.data.data.filter(s => s.status === 'Approved').length,
        totalFunding: 2500000, // Mock data
      });
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Startups',
      value: stats.totalStartups,
      icon: RocketLaunchIcon,
      color: 'from-purple-500 to-purple-600',
      change: '+12%',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'from-blue-500 to-blue-600',
      change: '+8%',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: ClockIcon,
      color: 'from-yellow-500 to-yellow-600',
      change: '-5%',
    },
    {
      title: 'Total Funding',
      value: `$${(stats.totalFunding / 1000000).toFixed(1)}M`,
      icon: CurrencyDollarIcon,
      color: 'from-green-500 to-green-600',
      change: '+23%',
    },
  ];

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
            Admin Dashboard
          </h1>
          <p className="text-white/60">Welcome back, {user?.name}! Here's your platform overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="glass-card p-6 hover:scale-105 transition-transform duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-400">{stat.change}</span>
              </div>
              <h3 className="text-white/60 text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/dashboard"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <RocketLaunchIcon className="w-10 h-10 text-accent-orange mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">Manage Startups</h3>
            <p className="text-white/60 text-sm">View and manage all startups in the platform</p>
          </Link>

          <Link
            to="/resources"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <ChartBarIcon className="w-10 h-10 text-accent-purple mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">Resources</h3>
            <p className="text-white/60 text-sm">Manage learning resources and materials</p>
          </Link>

          <Link
            to="/mentorship"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <UserGroupIcon className="w-10 h-10 text-accent-orange mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">Mentorship</h3>
            <p className="text-white/60 text-sm">Oversee mentorship programs and requests</p>
          </Link>
        </div>

        {/* Recent Startups */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Startups</h2>
            <Link to="/dashboard" className="text-accent-orange hover:text-orange-400 text-sm font-medium">
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            {recentStartups.map((startup) => (
              <div
                key={startup._id}
                className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate(`/startups/${startup._id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{startup.name}</h3>
                    <p className="text-white/60 text-sm">{startup.shortDesc}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      startup.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                      startup.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {startup.status}
                    </span>
                    <span className="text-white/60 text-sm">{startup.domain}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
