import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  TrophyIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import DashboardNav from '../components/DashboardNav';

/**
 * Investor Dashboard
 * For investors to track investments and discover startups
 */
const InvestorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalInvestments: 0,
    activeInvestments: 0,
    portfolioValue: 0,
    avgROI: 0,
  });

  useEffect(() => {
    // Mock data - implement actual API calls
    setStats({
      totalInvestments: 12,
      activeInvestments: 8,
      portfolioValue: 5200000,
      avgROI: 23.5,
    });
  }, []);

  const portfolioStartups = [
    {
      id: 1,
      name: 'TechVenture AI',
      domain: 'AI/ML',
      invested: 500000,
      currentValue: 750000,
      roi: 50,
      stage: 'Series A',
    },
    {
      id: 2,
      name: 'GreenEnergy Solutions',
      domain: 'CleanTech',
      invested: 300000,
      currentValue: 420000,
      roi: 40,
      stage: 'Seed',
    },
    {
      id: 3,
      name: 'HealthTech Pro',
      domain: 'HealthTech',
      invested: 400000,
      currentValue: 480000,
      roi: 20,
      stage: 'Series A',
    },
  ];

  const statCards = [
    {
      title: 'Total Investments',
      value: stats.totalInvestments,
      icon: RocketLaunchIcon,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Active Investments',
      value: stats.activeInvestments,
      icon: ChartBarIcon,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Portfolio Value',
      value: `$${(stats.portfolioValue / 1000000).toFixed(1)}M`,
      icon: CurrencyDollarIcon,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Average ROI',
      value: `${stats.avgROI}%`,
      icon: ArrowTrendingUpIcon,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNav />
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-display">
            Investor Dashboard
          </h1>
          <p className="text-white/60">Welcome back, {user?.name}! Monitor your portfolio performance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="glass-card p-6 hover:scale-105 transition-transform duration-300"
            >
              <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl w-fit mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white/60 text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/dashboard"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <RocketLaunchIcon className="w-10 h-10 text-accent-orange mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">Discover Startups</h3>
            <p className="text-white/60 text-sm">Explore investment opportunities</p>
          </Link>

          <Link
            to="/my-investments"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <ChartBarIcon className="w-10 h-10 text-accent-purple mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">My Portfolio</h3>
            <p className="text-white/60 text-sm">Track your investments</p>
          </Link>

          <Link
            to="/funding-applications"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <DocumentTextIcon className="w-10 h-10 text-accent-orange mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">Applications</h3>
            <p className="text-white/60 text-sm">Review funding requests</p>
          </Link>
        </div>

        {/* Portfolio Overview */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Portfolio Startups</h2>
            <Link to="/dashboard" className="text-accent-orange hover:text-orange-400 text-sm font-medium">
              Discover More →
            </Link>
          </div>

          {portfolioStartups.length === 0 ? (
            <div className="text-center py-12">
              <RocketLaunchIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Investments Yet</h3>
              <p className="text-white/60 mb-6">Start building your portfolio by investing in startups</p>
              <Link to="/dashboard" className="btn btn-primary">
                Explore Startups
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolioStartups.map((startup) => (
                <div
                  key={startup.id}
                  className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/startups/${startup.id}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg">{startup.name}</h3>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                          {startup.stage}
                        </span>
                      </div>
                      <p className="text-accent-orange text-sm mb-3">{startup.domain}</p>
                    </div>
                    <div className={`text-2xl font-bold ${
                      startup.roi > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      +{startup.roi}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-white/60 text-xs mb-1">Invested</p>
                      <p className="text-white font-semibold">${(startup.invested / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs mb-1">Current Value</p>
                      <p className="text-white font-semibold">${(startup.currentValue / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs mb-1">Return</p>
                      <p className="text-green-400 font-semibold">
                        +${((startup.currentValue - startup.invested) / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Investment Criteria */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Investment Criteria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-white/60 text-sm mb-2">Preferred Domains</h3>
              <div className="flex flex-wrap gap-2">
                {['AI/ML', 'FinTech', 'HealthTech', 'CleanTech'].map((domain) => (
                  <span key={domain} className="px-3 py-1 bg-accent-orange/20 text-accent-orange rounded-full text-sm">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-white/60 text-sm mb-2">Investment Range</h3>
              <p className="text-white font-medium">$100K - $1M per startup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;
