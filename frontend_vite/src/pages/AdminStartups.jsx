import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RocketLaunchIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    ChartBarIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { startupAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';
import DashboardNav from '../components/DashboardNav';

/**
 * Admin Startups Management Page
 * Full management panel for viewing and managing all startups
 */
const AdminStartups = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // State
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
        rejected: 0,
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

            const params = {
                page: currentPage,
                limit: 12,
            };

            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            if (domainFilter !== 'all') {
                params.domain = domainFilter;
            }

            const response = await startupAPI.getAll(params);
            const startupsData = response.data.data || [];

            setStartups(startupsData);
            setTotalPages(response.data.totalPages || 1);

            // Fetch stats by making separate calls for each status (with small limit just for count)
            const [pendingRes, approvedRes, activeRes, rejectedRes] = await Promise.all([
                startupAPI.getAll({ status: 'Pending', limit: 1 }),
                startupAPI.getAll({ status: 'Approved', limit: 1 }),
                startupAPI.getAll({ status: 'Active', limit: 1 }),
                startupAPI.getAll({ status: 'Rejected', limit: 1 })
            ]);

            // Use pagination.total or count from each response
            const getPaginationTotal = (res) => res.data.pagination?.total || res.data.count || 0;

            setStats({
                total: getPaginationTotal(pendingRes) + getPaginationTotal(approvedRes) +
                    getPaginationTotal(activeRes) + getPaginationTotal(rejectedRes),
                pending: getPaginationTotal(pendingRes),
                approved: getPaginationTotal(approvedRes),
                active: getPaginationTotal(activeRes),
                rejected: getPaginationTotal(rejectedRes)
            });

        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    // Filter startups based on search
    const filteredStartups = startups.filter(startup => {
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            startup.name?.toLowerCase().includes(search) ||
            startup.shortDesc?.toLowerCase().includes(search) ||
            startup.domain?.toLowerCase().includes(search) ||
            startup.founder?.name?.toLowerCase().includes(search)
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

    const handleBulkAction = async (action) => {
        if (selectedStartups.length === 0) {
            toast.error('Please select startups first');
            return;
        }

        try {
            setActionLoading(true);

            const statusMap = {
                approve: 'Approved',
                reject: 'Rejected',
                activate: 'Active'
            };

            await Promise.all(
                selectedStartups.map(id =>
                    startupAPI.updateStatus(id, { status: statusMap[action] })
                )
            );

            toast.success(`${selectedStartups.length} startups updated successfully`);
            setSelectedStartups([]);
            fetchStartups();
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setActionLoading(false);
        }
    };

    const toggleSelectStartup = (id) => {
        setSelectedStartups(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedStartups.length === filteredStartups.length) {
            setSelectedStartups([]);
        } else {
            setSelectedStartups(filteredStartups.map(s => s._id));
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Approved': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Active': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Rejected': 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const getStageBadge = (stage) => {
        const styles = {
            'Idea': 'text-purple-400',
            'MVP': 'text-blue-400',
            'Growth': 'text-green-400',
            'Scale': 'text-orange-400'
        };
        return styles[stage] || 'text-gray-400';
    };

    const statCards = [
        {
            title: 'Total Startups',
            value: stats.total,
            icon: RocketLaunchIcon,
            color: 'from-purple-500 to-purple-600'
        },
        {
            title: 'Pending Review',
            value: stats.pending,
            icon: ClockIcon,
            color: 'from-yellow-500 to-orange-500'
        },
        {
            title: 'Approved',
            value: stats.approved,
            icon: CheckCircleIcon,
            color: 'from-green-500 to-emerald-500'
        },
        {
            title: 'Active',
            value: stats.active,
            icon: ChartBarIcon,
            color: 'from-blue-500 to-cyan-500'
        }
    ];

    if (loading && startups.length === 0) {
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
                        Manage Startups
                    </h1>
                    <p className="text-white/60">
                        View, approve, and manage all startups in the platform
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
                        </div>
                    ))}
                </div>

                {/* Filters and Search */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search startups by name, description, or founder..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-accent-orange/50 transition-colors"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <FunnelIcon className="w-5 h-5 text-white/40" />

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-orange/50"
                            >
                                <option value="all">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Active">Active</option>
                                <option value="Rejected">Rejected</option>
                            </select>

                            {/* Domain Filter */}
                            <select
                                value={domainFilter}
                                onChange={(e) => {
                                    setDomainFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-orange/50"
                            >
                                <option value="all">All Domains</option>
                                {domains.map(domain => (
                                    <option key={domain} value={domain}>{domain}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedStartups.length > 0 && (
                    <div className="glass-card p-4 mb-6 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={selectAll}
                                className="text-accent-orange hover:text-orange-400 text-sm font-medium"
                            >
                                {selectedStartups.length === filteredStartups.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-white/60">
                                {selectedStartups.length} startup{selectedStartups.length !== 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction('approve')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                            >
                                ✓ Approve
                            </button>
                            <button
                                onClick={() => handleBulkAction('activate')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                            >
                                🚀 Activate
                            </button>
                            <button
                                onClick={() => handleBulkAction('reject')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                                ✗ Reject
                            </button>
                        </div>
                    </div>
                )}

                {/* Startups List */}
                <div className="glass-card p-6">
                    <div className="space-y-4">
                        {filteredStartups.map((startup) => (
                            <div
                                key={startup._id}
                                className={`bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors ${selectedStartups.includes(startup._id) ? 'ring-2 ring-accent-orange' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedStartups.includes(startup._id)}
                                            onChange={() => toggleSelectStartup(startup._id)}
                                            className="w-5 h-5 rounded bg-white/10 border-white/20 text-accent-orange focus:ring-accent-orange/50"
                                        />
                                    </div>

                                    {/* Logo/Avatar */}
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-orange to-accent-purple flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                                        {startup.name?.charAt(0) || 'S'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div>
                                                <h3 className="text-white font-bold text-lg">{startup.name}</h3>
                                                <p className="text-white/50 text-sm line-clamp-1">{startup.shortDesc}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(startup.status)}`}>
                                                    {startup.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 mb-3">
                                            <span className="flex items-center gap-1">
                                                <RocketLaunchIcon className="w-4 h-4" />
                                                {startup.domain}
                                            </span>
                                            <span className={`font-medium ${getStageBadge(startup.stage)}`}>
                                                {startup.stage}
                                            </span>
                                            {startup.founder && (
                                                <span className="flex items-center gap-1">
                                                    <UserGroupIcon className="w-4 h-4" />
                                                    {startup.founder.name || 'Unknown'}
                                                </span>
                                            )}
                                            {startup.kpis?.funding && (
                                                <span className="flex items-center gap-1">
                                                    <CurrencyDollarIcon className="w-4 h-4" />
                                                    ${(startup.kpis.funding / 1000).toFixed(0)}k raised
                                                </span>
                                            )}
                                            <span>
                                                {new Date(startup.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/startups/${startup._id}`)}
                                                className="px-3 py-1.5 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-sm flex items-center gap-1"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                                View Details
                                            </button>

                                            {startup.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(startup._id, 'Approved')}
                                                        disabled={actionLoading}
                                                        className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(startup._id, 'Rejected')}
                                                        disabled={actionLoading}
                                                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {startup.status === 'Approved' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(startup._id, 'Active')}
                                                    disabled={actionLoading}
                                                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-50"
                                                >
                                                    Activate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredStartups.length === 0 && !loading && (
                            <div className="text-center py-12 text-white/40">
                                <RocketLaunchIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">
                                    {searchQuery || statusFilter !== 'all' || domainFilter !== 'all'
                                        ? 'No startups match your filters'
                                        : 'No startups registered yet'}
                                </p>
                                {(searchQuery || statusFilter !== 'all' || domainFilter !== 'all') && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setStatusFilter('all');
                                            setDomainFilter('all');
                                        }}
                                        className="mt-4 text-accent-orange hover:text-orange-400"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-white/60 px-4">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminStartups;
