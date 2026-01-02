import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    RocketLaunchIcon,
    ClockIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    ChartBarIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { startupAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';
import tasavurLogo from '../assets/logo.jpg';
import RocketLoader from '../components/RocketLoader';

/**
 * Admin Startups Management - Clean Light Theme
 */
const AdminStartups = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [startups, setStartups] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [domainFilter, setDomainFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedStartups, setSelectedStartups] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        active: 0
    });

    const domains = [
        'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS',
        'AI/ML', 'IoT', 'CleanTech', 'AgriTech', 'Other'
    ];

    useEffect(() => {
        fetchStartups();
    }, [currentPage, statusFilter, domainFilter]);

    const fetchStartups = async () => {
        try {
            setLoading(true);

            const params = { page: currentPage, limit: 12 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (domainFilter !== 'all') params.domain = domainFilter;

            const response = await startupAPI.getAll(params);
            setStartups(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);

            // Fetch stats
            const [pendingRes, approvedRes, activeRes, rejectedRes] = await Promise.all([
                startupAPI.getAll({ status: 'Pending', limit: 1 }),
                startupAPI.getAll({ status: 'Approved', limit: 1 }),
                startupAPI.getAll({ status: 'Active', limit: 1 }),
                startupAPI.getAll({ status: 'Rejected', limit: 1 })
            ]);

            const getTotal = (res) => res.data.pagination?.total || res.data.count || 0;

            setStats({
                total: getTotal(pendingRes) + getTotal(approvedRes) + getTotal(activeRes) + getTotal(rejectedRes),
                pending: getTotal(pendingRes),
                approved: getTotal(approvedRes),
                active: getTotal(activeRes)
            });
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    const filteredStartups = startups.filter(startup => {
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            startup.name?.toLowerCase().includes(search) ||
            startup.shortDesc?.toLowerCase().includes(search) ||
            startup.domain?.toLowerCase().includes(search)
        );
    });

    const handleStatusUpdate = async (startupId, newStatus) => {
        try {
            setActionLoading(true);
            await startupAPI.updateStatus(startupId, { status: newStatus });
            toast.success(`Startup ${newStatus.toLowerCase()} successfully`);
            fetchStartups();
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': 'admin-badge-warning',
            'Approved': 'admin-badge-info',
            'Active': 'admin-badge-success',
            'Rejected': 'admin-badge-error'
        };
        return styles[status] || 'admin-badge-default';
    };

    const statCards = [
        { title: 'Total Startups', value: stats.total, icon: RocketLaunchIcon },
        { title: 'Pending Review', value: stats.pending, icon: ClockIcon },
        { title: 'Approved', value: stats.approved, icon: CheckCircleIcon },
        { title: 'Active', value: stats.active, icon: ChartBarIcon }
    ];

    if (loading && startups.length === 0) {
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
                                    <Link to="/admin/startups" className="admin-nav-link active">Manage Startups</Link>
                                    <Link to="/mentorship" className="admin-nav-link">Mentorship</Link>
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
                        <h1 className="admin-title">Manage Startups</h1>
                        <p className="admin-subtitle">View, approve, and manage all startups in the platform</p>
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
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="admin-card mb-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div className="relative flex-1 max-w-md">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search startups..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="admin-input pl-12"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                    className="admin-select"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Active">Active</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                                <select
                                    value={domainFilter}
                                    onChange={(e) => { setDomainFilter(e.target.value); setCurrentPage(1); }}
                                    className="admin-select"
                                >
                                    <option value="all">All Domains</option>
                                    {domains.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Startups List */}
                    <div className="admin-section">
                        <div className="admin-section-content p-0">
                            {filteredStartups.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {filteredStartups.map((startup) => (
                                        <div key={startup._id} className="px-6 py-5 admin-list-item">
                                            <div className="flex items-start gap-4">
                                                <div className="admin-avatar admin-avatar-lg bg-gray-100">
                                                    {startup.name?.charAt(0) || 'S'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-semibold text-black text-lg">{startup.name}</h3>
                                                        <span className={`admin-badge ${getStatusBadge(startup.status)}`}>
                                                            {startup.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-500 text-sm mb-3 line-clamp-1">{startup.shortDesc}</p>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <RocketLaunchIcon className="w-4 h-4" />
                                                            {startup.domain}
                                                        </span>
                                                        <span>{startup.stage}</span>
                                                        {startup.founder && (
                                                            <span className="flex items-center gap-1">
                                                                <UserGroupIcon className="w-4 h-4" />
                                                                {startup.founder.name}
                                                            </span>
                                                        )}
                                                        <span>
                                                            {new Date(startup.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short', day: 'numeric', year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/startups/${startup._id}`)}
                                                        className="admin-btn admin-btn-ghost"
                                                    >
                                                        <EyeIcon className="w-4 h-4 mr-1 inline" />
                                                        View
                                                    </button>
                                                    {startup.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(startup._id, 'Approved')}
                                                                disabled={actionLoading}
                                                                className="admin-btn admin-btn-success"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(startup._id, 'Rejected')}
                                                                disabled={actionLoading}
                                                                className="admin-btn admin-btn-danger"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {startup.status === 'Approved' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(startup._id, 'Active')}
                                                            disabled={actionLoading}
                                                            className="admin-btn admin-btn-primary"
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="admin-empty-state">
                                    <RocketLaunchIcon className="admin-empty-state-icon" />
                                    <p className="admin-empty-state-title">No startups found</p>
                                    <p className="admin-empty-state-text">
                                        {searchQuery || statusFilter !== 'all' || domainFilter !== 'all'
                                            ? 'Try adjusting your filters'
                                            : 'No startups registered yet'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="admin-btn admin-btn-secondary disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-gray-500 px-4">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="admin-btn admin-btn-secondary disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
                {/* End admin-content */}
            </div>
        </div>
    );
};

export default AdminStartups;
