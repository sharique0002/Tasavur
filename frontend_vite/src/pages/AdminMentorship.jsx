import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    UserGroupIcon,
    ClockIcon,
    CheckCircleIcon,
    StarIcon,
    MagnifyingGlassIcon,
    AcademicCapIcon,
    CalendarDaysIcon,
    ChatBubbleLeftRightIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { mentorshipAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';
import tasavurLogo from '../assets/logo.jpg';
import RocketLoader from '../components/RocketLoader';

/**
 * Admin Mentorship Page - Clean Light Theme
 */
const AdminMentorship = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

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
            const [mentorsRes, requestsRes] = await Promise.all([
                mentorshipAPI.getMentors({ limit: 100 }),
                mentorshipAPI.getRequests({ limit: 100 })
            ]);

            const mentorsData = mentorsRes.data.data || [];
            const requestsData = requestsRes.data.data || [];

            setMentors(mentorsData);
            setRequests(requestsData);

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

    const filteredMentors = mentors.filter(mentor => {
        if (!mentorSearch) return true;
        const search = mentorSearch.toLowerCase();
        return (
            mentor.name?.toLowerCase().includes(search) ||
            mentor.expertise?.some(e => e.toLowerCase().includes(search))
        );
    });

    const filteredRequests = requests.filter(request => {
        if (requestFilter === 'all') return true;
        return request.status?.toLowerCase() === requestFilter.toLowerCase();
    });

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': 'admin-badge-warning',
            'Matched': 'admin-badge-info',
            'Scheduled': 'admin-badge-default',
            'Completed': 'admin-badge-success',
            'Cancelled': 'admin-badge-error'
        };
        return styles[status] || 'admin-badge-default';
    };

    const statCards = [
        { title: 'Total Mentors', value: stats.totalMentors, subtext: `${stats.activeMentors} active`, icon: UserGroupIcon },
        { title: 'Pending Requests', value: stats.pendingRequests, subtext: 'Awaiting match', icon: ClockIcon },
        { title: 'Matched Requests', value: stats.matchedRequests, subtext: 'In progress', icon: ChatBubbleLeftRightIcon },
        { title: 'Completed Sessions', value: stats.completedSessions, subtext: 'Successfully finished', icon: CheckCircleIcon }
    ];

    if (loading) {
        return (
            <div className="admin-page flex items-center justify-center">
                <RocketLoader text="LOADING" />
            </div>
        );
    }

    return (
        <div className="admin-page">
            {/* Floating Orbs Background */}
            <div className="admin-floating-orbs">
                <div className="admin-orb admin-orb-1"></div>
                <div className="admin-orb admin-orb-2"></div>
                <div className="admin-orb admin-orb-3"></div>
            </div>

            {/* Content Wrapper */}
            <div className="admin-content">
                {/* Navigation */}
                <nav className="admin-nav">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <Link to="/" className="flex items-center gap-3">
                                    <img src={tasavurLogo} alt="Tasavur" className="w-10 h-10 rounded-full object-cover" />
                                    <span className="text-xl font-bold text-black">Tasavur</span>
                                </Link>
                                <div className="hidden md:flex items-center gap-6">
                                    <Link to="/dashboard" className="admin-nav-link">Dashboard</Link>
                                    <Link to="/admin/startups" className="admin-nav-link">Manage Startups</Link>
                                    <Link to="/mentorship" className="admin-nav-link active">Mentorship</Link>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">{user?.name}</span>
                                <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">admin</span>
                                <button onClick={logout} className="admin-btn admin-btn-secondary">Logout</button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Header */}
                <div className="border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <Link to="/dashboard" className="inline-flex items-center text-gray-500 hover:text-black mb-4 text-sm">
                            <ArrowLeftIcon className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </Link>
                        <h1 className="admin-title">Mentorship Management</h1>
                        <p className="admin-subtitle">Oversee mentorship programs, manage mentors, and track requests</p>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 admin-stagger">
                        {statCards.map((stat, index) => (
                            <div key={index} className="admin-stat-card">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                                        <stat.icon className="w-5 h-5 text-purple-600" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">{stat.title}</p>
                                <p className="text-3xl font-bold text-black admin-stat-value">{stat.value}</p>
                                <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="admin-tabs mb-6 inline-flex">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('mentors')}
                            className={`admin-tab ${activeTab === 'mentors' ? 'active' : ''}`}
                        >
                            Mentors ({mentors.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`}
                        >
                            Requests ({requests.length})
                        </button>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Mentors */}
                            <div className="admin-section">
                                <div className="admin-section-header">
                                    <h2 className="admin-section-title flex items-center gap-2">
                                        <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                                        Recent Mentors
                                    </h2>
                                    <button onClick={() => setActiveTab('mentors')} className="text-sm text-gray-500 hover:text-black">
                                        View All →
                                    </button>
                                </div>
                                <div className="admin-section-content p-0">
                                    {mentors.slice(0, 5).map((mentor) => (
                                        <div key={mentor._id} className="px-6 py-4 border-b border-gray-50 last:border-0 admin-list-item">
                                            <div className="flex items-center gap-4">
                                                <div className="admin-avatar">{mentor.name?.charAt(0) || 'M'}</div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-black">{mentor.name}</h3>
                                                    <p className="text-sm text-gray-500">{mentor.expertise?.slice(0, 2).join(', ')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-yellow-500">
                                                        <StarIcon className="w-4 h-4 fill-current" />
                                                        <span className="text-sm">{mentor.rating?.toFixed(1) || '0.0'}</span>
                                                    </div>
                                                    <span className={`text-xs ${mentor.availability === 'Available' ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {mentor.availability}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {mentors.length === 0 && (
                                        <div className="admin-empty-state py-8">
                                            <UserGroupIcon className="admin-empty-state-icon w-10 h-10" />
                                            <p className="admin-empty-state-text">No mentors registered</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Requests */}
                            <div className="admin-section">
                                <div className="admin-section-header">
                                    <h2 className="admin-section-title flex items-center gap-2">
                                        <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                                        Recent Requests
                                    </h2>
                                    <button onClick={() => setActiveTab('requests')} className="text-sm text-gray-500 hover:text-black">
                                        View All →
                                    </button>
                                </div>
                                <div className="admin-section-content p-0">
                                    {requests.slice(0, 5).map((request) => (
                                        <div key={request._id} className="px-6 py-4 border-b border-gray-50 last:border-0 admin-list-item">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-black truncate">{request.topic}</h3>
                                                    <p className="text-sm text-gray-500">{request.startup?.name || 'Unknown Startup'}</p>
                                                </div>
                                                <span className={`admin-badge ${getStatusBadge(request.status)}`}>{request.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {requests.length === 0 && (
                                        <div className="admin-empty-state py-8">
                                            <ChatBubbleLeftRightIcon className="admin-empty-state-icon w-10 h-10" />
                                            <p className="admin-empty-state-text">No requests yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mentors Tab */}
                    {activeTab === 'mentors' && (
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <div className="relative flex-1 max-w-md">
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search mentors..."
                                        value={mentorSearch}
                                        onChange={(e) => setMentorSearch(e.target.value)}
                                        className="admin-input pl-10 py-2"
                                    />
                                </div>
                            </div>
                            <div className="admin-section-content p-0">
                                {filteredMentors.map((mentor) => (
                                    <div key={mentor._id} className="px-6 py-5 border-b border-gray-50 last:border-0 admin-list-item">
                                        <div className="flex items-start gap-4">
                                            <div className="admin-avatar admin-avatar-lg">{mentor.name?.charAt(0) || 'M'}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-black text-lg">{mentor.name}</h3>
                                                    <div className="flex items-center gap-1 text-yellow-500">
                                                        <StarIcon className="w-4 h-4 fill-current" />
                                                        <span className="text-sm">{mentor.rating?.toFixed(1) || '0.0'}</span>
                                                    </div>
                                                    <span className={`admin-badge ${mentor.availability === 'Available' ? 'admin-badge-success' : 'admin-badge-default'}`}>
                                                        {mentor.availability}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {mentor.expertise?.slice(0, 4).map((skill, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">{skill}</span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-3">
                                                    <span>Sessions: {mentor.sessionsCompleted || 0}</span>
                                                    <span>Mentees: {mentor.currentMentees?.length || 0}/{mentor.maxMentees || 5}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredMentors.length === 0 && (
                                    <div className="admin-empty-state">
                                        <UserGroupIcon className="admin-empty-state-icon" />
                                        <p className="admin-empty-state-title">{mentorSearch ? 'No mentors match your search' : 'No mentors registered'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <div className="flex gap-2">
                                    {['all', 'pending', 'matched', 'scheduled', 'completed'].map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setRequestFilter(filter)}
                                            className={`admin-btn ${requestFilter === filter ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="admin-section-content p-0">
                                {filteredRequests.map((request) => (
                                    <div key={request._id} className="px-6 py-5 border-b border-gray-50 last:border-0 admin-list-item">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-black text-lg">{request.topic}</h3>
                                                    <span className={`admin-badge ${getStatusBadge(request.status)}`}>{request.status}</span>
                                                </div>
                                                <p className="text-gray-500 text-sm mb-2 line-clamp-2">{request.description}</p>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {request.skills?.slice(0, 4).map((skill, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">{skill}</span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                                    <span>Startup: {request.startup?.name || 'Unknown'}</span>
                                                    <span>By: {request.requestedBy?.name || 'Unknown'}</span>
                                                    <span>{new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredRequests.length === 0 && (
                                    <div className="admin-empty-state">
                                        <ChatBubbleLeftRightIcon className="admin-empty-state-icon" />
                                        <p className="admin-empty-state-title">{requestFilter !== 'all' ? `No ${requestFilter} requests` : 'No requests yet'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* End admin-content */}
            </div>
        </div>
    );
};

export default AdminMentorship;

