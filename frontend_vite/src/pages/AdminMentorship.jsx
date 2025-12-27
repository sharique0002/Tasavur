import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UserGroupIcon,
    ClockIcon,
    CheckCircleIcon,
    StarIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    AcademicCapIcon,
    CalendarDaysIcon,
    ChatBubbleLeftRightIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { mentorshipAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';
import DashboardNav from '../components/DashboardNav';

/**
 * Admin Mentorship Page
 * Full management panel for mentorship programs, mentors, and requests
 */
const AdminMentorship = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [mentors, setMentors] = useState([]);
    const [requests, setRequests] = useState([]);
    const [mentorSearch, setMentorSearch] = useState('');
    const [requestFilter, setRequestFilter] = useState('all');
    const [stats, setStats] = useState({
        totalMentors: 0,
        activeMentors: 0,
        totalRequests: 0,
        pendingRequests: 0,
        matchedRequests: 0,
        completedSessions: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch mentors and requests in parallel
            const [mentorsRes, requestsRes] = await Promise.all([
                mentorshipAPI.getMentors({ limit: 100 }),
                mentorshipAPI.getRequests({ limit: 100 })
            ]);

            const mentorsData = mentorsRes.data.data || [];
            const requestsData = requestsRes.data.data || [];

            setMentors(mentorsData);
            setRequests(requestsData);

            // Calculate stats
            setStats({
                totalMentors: mentorsData.length,
                activeMentors: mentorsData.filter(m => m.isActive && m.availability !== 'Unavailable').length,
                totalRequests: requestsData.length,
                pendingRequests: requestsData.filter(r => r.status === 'Pending').length,
                matchedRequests: requestsData.filter(r => r.status === 'Matched').length,
                completedSessions: requestsData.filter(r => r.status === 'Completed').length
            });
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    // Filter mentors based on search
    const filteredMentors = mentors.filter(mentor => {
        if (!mentorSearch) return true;
        const search = mentorSearch.toLowerCase();
        return (
            mentor.name?.toLowerCase().includes(search) ||
            mentor.expertise?.some(e => e.toLowerCase().includes(search)) ||
            mentor.domains?.some(d => d.toLowerCase().includes(search))
        );
    });

    // Filter requests based on status filter
    const filteredRequests = requests.filter(request => {
        if (requestFilter === 'all') return true;
        return request.status?.toLowerCase() === requestFilter.toLowerCase();
    });

    const statCards = [
        {
            title: 'Total Mentors',
            value: stats.totalMentors,
            icon: UserGroupIcon,
            color: 'from-purple-500 to-purple-600',
            subtext: `${stats.activeMentors} active`
        },
        {
            title: 'Pending Requests',
            value: stats.pendingRequests,
            icon: ClockIcon,
            color: 'from-yellow-500 to-orange-500',
            subtext: 'Awaiting match'
        },
        {
            title: 'Matched Requests',
            value: stats.matchedRequests,
            icon: ChatBubbleLeftRightIcon,
            color: 'from-blue-500 to-cyan-500',
            subtext: 'In progress'
        },
        {
            title: 'Completed Sessions',
            value: stats.completedSessions,
            icon: CheckCircleIcon,
            color: 'from-green-500 to-emerald-500',
            subtext: 'Successfully finished'
        }
    ];

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Matched': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Scheduled': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'Completed': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Cancelled': 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const getUrgencyBadge = (urgency) => {
        const styles = {
            'Low': 'text-green-400',
            'Medium': 'text-yellow-400',
            'High': 'text-orange-400',
            'Critical': 'text-red-400'
        };
        return styles[urgency] || 'text-gray-400';
    };

    const getAvailabilityColor = (availability) => {
        const colors = {
            'Available': 'text-green-400',
            'Busy': 'text-yellow-400',
            'Unavailable': 'text-red-400'
        };
        return colors[availability] || 'text-gray-400';
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
                        Mentorship Management
                    </h1>
                    <p className="text-white/60">
                        Oversee mentorship programs, manage mentors, and track requests
                    </p>
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
                            </div>
                            <h3 className="text-white/60 text-sm mb-1">{stat.title}</h3>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                            <p className="text-white/40 text-sm mt-1">{stat.subtext}</p>
                        </div>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'overview'
                                ? 'text-accent-orange'
                                : 'text-white/60 hover:text-white'
                            }`}
                    >
                        Overview
                        {activeTab === 'overview' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-orange"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('mentors')}
                        className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'mentors'
                                ? 'text-accent-orange'
                                : 'text-white/60 hover:text-white'
                            }`}
                    >
                        Mentors ({mentors.length})
                        {activeTab === 'mentors' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-orange"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'requests'
                                ? 'text-accent-orange'
                                : 'text-white/60 hover:text-white'
                            }`}
                    >
                        Requests ({requests.length})
                        {activeTab === 'requests' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-orange"></div>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Mentors */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <AcademicCapIcon className="w-6 h-6 text-accent-purple" />
                                    Recent Mentors
                                </h2>
                                <button
                                    onClick={() => setActiveTab('mentors')}
                                    className="text-accent-orange hover:text-orange-400 text-sm font-medium"
                                >
                                    View All →
                                </button>
                            </div>

                            <div className="space-y-4">
                                {mentors.slice(0, 5).map((mentor) => (
                                    <div
                                        key={mentor._id}
                                        className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-purple to-accent-orange flex items-center justify-center text-white font-bold text-lg">
                                                {mentor.name?.charAt(0) || 'M'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-semibold truncate">{mentor.name}</h3>
                                                <p className="text-white/50 text-sm truncate">
                                                    {mentor.expertise?.slice(0, 2).join(', ')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-yellow-400">
                                                    <StarIcon className="w-4 h-4 fill-yellow-400" />
                                                    <span className="text-sm">{mentor.rating?.toFixed(1) || '0.0'}</span>
                                                </div>
                                                <span className={`text-xs ${getAvailabilityColor(mentor.availability)}`}>
                                                    {mentor.availability}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {mentors.length === 0 && (
                                    <div className="text-center py-8 text-white/40">
                                        <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No mentors registered yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Requests */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CalendarDaysIcon className="w-6 h-6 text-accent-cyan" />
                                    Recent Requests
                                </h2>
                                <button
                                    onClick={() => setActiveTab('requests')}
                                    className="text-accent-orange hover:text-orange-400 text-sm font-medium"
                                >
                                    View All →
                                </button>
                            </div>

                            <div className="space-y-4">
                                {requests.slice(0, 5).map((request) => (
                                    <div
                                        key={request._id}
                                        className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-semibold truncate">{request.topic}</h3>
                                                <p className="text-white/50 text-sm mt-1">
                                                    {request.startup?.name || 'Unknown Startup'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                                                    {request.status}
                                                </span>
                                                {request.urgency && request.urgency !== 'Medium' && (
                                                    <span className={`text-xs flex items-center gap-1 ${getUrgencyBadge(request.urgency)}`}>
                                                        <ExclamationTriangleIcon className="w-3 h-3" />
                                                        {request.urgency}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {requests.length === 0 && (
                                    <div className="text-center py-8 text-white/40">
                                        <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No mentorship requests yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mentors' && (
                    <div className="glass-card p-6">
                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search mentors by name, expertise, or domain..."
                                    value={mentorSearch}
                                    onChange={(e) => setMentorSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-accent-orange/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Mentors List */}
                        <div className="space-y-4">
                            {filteredMentors.map((mentor) => (
                                <div
                                    key={mentor._id}
                                    className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-purple to-accent-orange flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                                            {mentor.name?.charAt(0) || 'M'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-white font-bold text-lg">{mentor.name}</h3>
                                                    {mentor.title && mentor.company && (
                                                        <p className="text-white/50 text-sm">{mentor.title} at {mentor.company}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 text-yellow-400">
                                                        <StarIcon className="w-5 h-5 fill-yellow-400" />
                                                        <span className="font-medium">{mentor.rating?.toFixed(1) || '0.0'}</span>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${mentor.availability === 'Available'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : mentor.availability === 'Busy'
                                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                                : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {mentor.availability}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {mentor.expertise?.slice(0, 4).map((skill, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-accent-purple/20 text-accent-purple rounded-lg text-xs">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {mentor.expertise?.length > 4 && (
                                                    <span className="px-2 py-1 bg-white/10 text-white/50 rounded-lg text-xs">
                                                        +{mentor.expertise.length - 4} more
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center gap-4 text-white/50 text-sm">
                                                <span>Sessions: {mentor.sessionsCompleted || 0}</span>
                                                <span>•</span>
                                                <span>Mentees: {mentor.currentMentees?.length || 0}/{mentor.maxMentees || 5}</span>
                                                {mentor.domains && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{mentor.domains.slice(0, 2).join(', ')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredMentors.length === 0 && (
                                <div className="text-center py-12 text-white/40">
                                    <UserGroupIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">
                                        {mentorSearch ? 'No mentors match your search' : 'No mentors registered yet'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="glass-card p-6">
                        {/* Filter */}
                        <div className="mb-6 flex items-center gap-4">
                            <FunnelIcon className="w-5 h-5 text-white/40" />
                            <div className="flex gap-2">
                                {['all', 'pending', 'matched', 'scheduled', 'completed', 'cancelled'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setRequestFilter(filter)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${requestFilter === filter
                                                ? 'bg-accent-orange text-white'
                                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Requests List */}
                        <div className="space-y-4">
                            {filteredRequests.map((request) => (
                                <div
                                    key={request._id}
                                    className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-white font-bold text-lg">{request.topic}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                                                    {request.status}
                                                </span>
                                                {request.urgency && (
                                                    <span className={`text-xs flex items-center gap-1 ${getUrgencyBadge(request.urgency)}`}>
                                                        <ExclamationTriangleIcon className="w-3 h-3" />
                                                        {request.urgency}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-white/60 text-sm line-clamp-2 mb-3">
                                                {request.description}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {request.skills?.slice(0, 4).map((skill, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-accent-cyan/20 text-accent-cyan rounded-lg text-xs">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-4 text-white/50 text-sm">
                                                <span>Startup: {request.startup?.name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>By: {request.requestedBy?.name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>
                                                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            {request.matchedMentors?.length > 0 && (
                                                <span className="text-white/50 text-sm">
                                                    {request.matchedMentors.length} matched
                                                </span>
                                            )}
                                            {request.selectedMentor && (
                                                <span className="text-accent-orange text-sm">
                                                    Mentor selected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredRequests.length === 0 && (
                                <div className="text-center py-12 text-white/40">
                                    <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">
                                        {requestFilter !== 'all'
                                            ? `No ${requestFilter} requests`
                                            : 'No mentorship requests yet'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMentorship;
