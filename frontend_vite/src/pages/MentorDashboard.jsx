import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import DashboardNav from '../components/DashboardNav';

/**
 * Mentor Dashboard
 * For mentors to manage their sessions and mentees
 */
const MentorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    avgRating: 0,
  });

  useEffect(() => {
    // Mock data - implement actual API calls
    setStats({
      totalSessions: 24,
      upcomingSessions: 3,
      completedSessions: 21,
      avgRating: 4.8,
    });
  }, []);

  const upcomingSessions = [
    {
      id: 1,
      startup: 'TechVenture AI',
      topic: 'Fundraising Strategy',
      date: '2024-01-15',
      time: '10:00 AM',
      duration: '60 min',
      meetingLink: 'https://zoom.us/j/123456789',
    },
    {
      id: 2,
      startup: 'GreenEnergy Solutions',
      topic: 'Market Expansion',
      date: '2024-01-16',
      time: '2:00 PM',
      duration: '45 min',
      meetingLink: 'https://zoom.us/j/987654321',
    },
  ];

  const handleJoinSession = (session) => {
    if (session.meetingLink) {
      // Open meeting link in new tab
      window.open(session.meetingLink, '_blank', 'noopener,noreferrer');
      toast.success(`Joining session with ${session.startup}`);
    } else {
      toast.error('Meeting link not available yet');
    }
  };

  const statCards = [
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: UserGroupIcon,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Upcoming Sessions',
      value: stats.upcomingSessions,
      icon: CalendarIcon,
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Completed Sessions',
      value: stats.completedSessions,
      icon: CheckCircleIcon,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Average Rating',
      value: stats.avgRating.toFixed(1),
      icon: StarIcon,
      color: 'from-yellow-500 to-yellow-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNav />
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-display">
            Mentor Dashboard
          </h1>
          <p className="text-white/60">Welcome back, {user?.name}! Guide startups to success.</p>
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
            to="/mentorship-requests"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <UserGroupIcon className="w-10 h-10 text-accent-orange mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">Mentorship Requests</h3>
            <p className="text-white/60 text-sm">View and accept new mentorship requests</p>
          </Link>

          <Link
            to="/my-sessions"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <CalendarIcon className="w-10 h-10 text-accent-purple mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">My Sessions</h3>
            <p className="text-white/60 text-sm">Manage your mentoring sessions</p>
          </Link>

          <Link
            to="/resources"
            className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
          >
            <AcademicCapIcon className="w-10 h-10 text-accent-orange mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">Resources</h3>
            <p className="text-white/60 text-sm">Share knowledge and materials</p>
          </Link>
        </div>

        {/* Upcoming Sessions */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Upcoming Sessions</h2>
            <Link to="/my-sessions" className="text-accent-orange hover:text-orange-400 text-sm font-medium">
              View All →
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Upcoming Sessions</h3>
              <p className="text-white/60">Accept mentorship requests to schedule sessions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1">{session.startup}</h3>
                      <p className="text-accent-orange text-sm mb-3">{session.topic}</p>
                      <div className="flex items-center gap-6 text-sm text-white/60">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{session.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          <span>{session.time} ({session.duration})</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleJoinSession(session)}
                      className="btn btn-primary text-sm hover:scale-105 transition-transform"
                    >
                      Join Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expertise & Availability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">My Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {['Fundraising', 'Product Strategy', 'Marketing', 'Team Building', 'Sales'].map((skill) => (
                <span key={skill} className="px-4 py-2 bg-accent-orange/20 text-accent-orange rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Availability</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Monday - Friday</span>
                <span className="text-white font-medium">9:00 AM - 5:00 PM</span>
              </div>
              <button className="text-accent-orange hover:text-orange-400 text-sm font-medium">
                Update Availability →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
