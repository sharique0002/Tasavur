const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Startup = require('../models/Startup');
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const Resource = require('../models/Resource');
const Notification = require('../models/Notification');

/**
 * Dashboard Routes
 * Provides role-specific dashboard data and statistics
 */

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard data based on user role
 * @access  Protected
 */
router.get('/', protect, async (req, res) => {
  try {
    const { role, _id: userId } = req.user;

    let dashboardData = {};

    switch (role) {
      case 'admin':
        dashboardData = await getAdminDashboard();
        break;
      case 'founder':
        dashboardData = await getFounderDashboard(req.user);
        break;
      case 'mentor':
        dashboardData = await getMentorDashboard(req.user);
        break;
      case 'investor':
        dashboardData = await getInvestorDashboard();
        break;
      default:
        dashboardData = await getBasicDashboard(req.user);
    }

    // Get notifications for all users
    const unreadNotifications = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    dashboardData.notifications = {
      unread: unreadNotifications,
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get admin dashboard statistics
 */
async function getAdminDashboard() {
  try {
    // Get counts in parallel for efficiency
    const [
      totalStartups,
      pendingStartups,
      activeStartups,
      totalUsers,
      totalMentors,
      totalResources,
      pendingRequests,
      startupsByStatus,
      startupsByDomain,
      recentStartups,
      recentUsers,
    ] = await Promise.all([
      Startup.countDocuments(),
      Startup.countDocuments({ status: 'Pending' }),
      Startup.countDocuments({ status: 'Active' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'mentor', isActive: true }),
      Resource.countDocuments({ status: 'Published' }),
      MentorshipRequest.countDocuments({ status: 'Pending' }),
      // Startups by status aggregation
      Startup.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Startups by domain aggregation
      Startup.aggregate([
        { $group: { _id: '$domain', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Recent startups
      Startup.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('founder', 'name email')
        .select('name domain stage status createdAt')
        .lean(),
      // Recent users
      User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt')
        .lean(),
    ]);

    // Calculate growth (compare to 30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [startupsLastMonth, usersLastMonth] = await Promise.all([
      Startup.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    return {
      role: 'admin',
      overview: {
        totalStartups,
        pendingStartups,
        activeStartups,
        totalUsers,
        totalMentors,
        totalResources,
        pendingRequests,
      },
      growth: {
        startupsLast30Days: startupsLastMonth,
        usersLast30Days: usersLastMonth,
      },
      charts: {
        byStatus: startupsByStatus,
        byDomain: startupsByDomain,
      },
      recent: {
        startups: recentStartups,
        users: recentUsers,
      },
      actions: [
        { label: 'Review Pending Startups', count: pendingStartups, link: '/admin/startups?status=Pending' },
        { label: 'Process Mentorship Requests', count: pendingRequests, link: '/admin/mentorship' },
      ],
    };
  } catch (error) {
    console.error('Admin dashboard error:', error);
    throw error;
  }
}

/**
 * Get founder dashboard data
 */
async function getFounderDashboard(user) {
  try {
    const startupId = user.startup;
    let startup = null;
    let mentorshipStats = null;
    let recentSessions = [];

    if (startupId) {
      startup = await Startup.findById(startupId)
        .populate('mentors', 'name expertise avatar rating')
        .lean();

      if (startup) {
        // Get mentorship statistics
        const [totalRequests, activeRequests, sessions] = await Promise.all([
          MentorshipRequest.countDocuments({ startup: startupId }),
          MentorshipRequest.countDocuments({
            startup: startupId,
            status: { $in: ['Pending', 'Matched', 'Scheduled'] },
          }),
          MentorshipRequest.find({ startup: startupId })
            .select('sessions selectedMentor status')
            .populate('selectedMentor', 'name')
            .lean(),
        ]);

        // Calculate completed sessions
        let completedSessions = 0;
        let upcomingSessions = [];

        sessions.forEach(req => {
          if (req.sessions) {
            completedSessions += req.sessions.filter(s => s.status === 'Completed').length;
            const upcoming = req.sessions.filter(
              s => s.status === 'Scheduled' && new Date(s.scheduledAt) > new Date()
            );
            upcomingSessions = upcomingSessions.concat(
              upcoming.map(s => ({
                ...s,
                mentorName: req.selectedMentor?.name || 'TBD',
              }))
            );
          }
        });

        mentorshipStats = {
          totalRequests,
          activeRequests,
          completedSessions,
          upcomingSessions: upcomingSessions.slice(0, 5),
        };
      }
    }

    // Get recommended resources
    const resources = await Resource.find({
      visibility: { $in: ['Public', 'Members Only'] },
      status: 'Published',
      targetAudience: { $in: ['founder', 'all'] },
    })
      .sort({ downloadCount: -1 })
      .limit(5)
      .select('title type tags downloadCount')
      .lean();

    return {
      role: 'founder',
      startup,
      mentorship: mentorshipStats,
      resources,
      actions: startup
        ? [
          startup.status === 'Active'
            ? { label: 'Request Mentorship', link: '/mentor-request' }
            : { label: 'Check Application Status', link: `/startups/${startupId}` },
          { label: 'Browse Resources', link: '/resources' },
        ]
        : [
          { label: 'Register Your Startup', link: '/onboard' },
        ],
    };
  } catch (error) {
    console.error('Founder dashboard error:', error);
    throw error;
  }
}

/**
 * Get mentor dashboard data
 */
async function getMentorDashboard(user) {
  try {
    const Mentor = require('../models/Mentor');
    const mentor = await Mentor.findOne({ user: user._id });

    if (!mentor) {
      return {
        role: 'mentor',
        mentor: null,
        message: 'Mentor profile not set up',
        actions: [
          { label: 'Complete Mentor Profile', link: '/profile' },
        ],
      };
    }

    // Get mentorship requests
    const [pendingRequests, activeMentees, completedSessions, recentRequests] = await Promise.all([
      MentorshipRequest.countDocuments({
        'matchedMentors.mentor': mentor._id,
        status: { $in: ['Pending', 'Matched'] },
      }),
      Startup.countDocuments({ mentors: mentor._id }),
      MentorshipRequest.aggregate([
        { $match: { selectedMentor: mentor._id } },
        { $unwind: '$sessions' },
        { $match: { 'sessions.status': 'Completed' } },
        { $count: 'count' },
      ]),
      MentorshipRequest.find({
        'matchedMentors.mentor': mentor._id,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('startup', 'name domain')
        .populate('requestedBy', 'name')
        .select('topic status createdAt')
        .lean(),
    ]);

    // Get upcoming sessions
    const upcomingSessions = await MentorshipRequest.aggregate([
      { $match: { selectedMentor: mentor._id } },
      { $unwind: '$sessions' },
      {
        $match: {
          'sessions.status': 'Scheduled',
          'sessions.scheduledAt': { $gte: new Date() },
        },
      },
      { $sort: { 'sessions.scheduledAt': 1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'startups',
          localField: 'startup',
          foreignField: '_id',
          as: 'startupInfo',
        },
      },
      {
        $project: {
          session: '$sessions',
          startup: { $arrayElemAt: ['$startupInfo', 0] },
        },
      },
    ]);

    return {
      role: 'mentor',
      mentor: {
        name: mentor.name,
        expertise: mentor.expertise,
        domains: mentor.domains,
        rating: mentor.rating,
        sessionsCompleted: mentor.sessionsCompleted,
        availability: mentor.availability,
        currentMentees: mentor.currentMentees.length,
        maxMentees: mentor.maxMentees,
      },
      stats: {
        pendingRequests,
        activeMentees,
        completedSessions: completedSessions[0]?.count || 0,
      },
      recentRequests,
      upcomingSessions,
      actions: [
        { label: 'View Pending Requests', count: pendingRequests, link: '/mentorship/requests' },
        { label: 'Manage Availability', link: '/profile#availability' },
      ],
    };
  } catch (error) {
    console.error('Mentor dashboard error:', error);
    throw error;
  }
}

/**
 * Get investor dashboard data
 */
async function getInvestorDashboard() {
  try {
    // Get active startups
    const [activeStartups, fundedStartups, startupsByStage] = await Promise.all([
      Startup.find({ status: 'Active' })
        .sort({ 'kpis.funding': -1 })
        .limit(10)
        .select('name domain stage kpis founders')
        .lean(),
      Startup.countDocuments({ 'kpis.funding': { $gt: 0 } }),
      Startup.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: '$stage', count: { $sum: 1 }, totalFunding: { $sum: '$kpis.funding' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Calculate total funding
    const totalFundingResult = await Startup.aggregate([
      { $group: { _id: null, total: { $sum: '$kpis.funding' } } },
    ]);

    return {
      role: 'investor',
      overview: {
        totalActiveStartups: activeStartups.length,
        fundedStartups,
        totalFunding: totalFundingResult[0]?.total || 0,
      },
      charts: {
        byStage: startupsByStage,
      },
      featured: activeStartups.slice(0, 5),
      actions: [
        { label: 'Browse Portfolio', link: '/portfolio' },
        { label: 'View Active Startups', link: '/startups?status=Active' },
      ],
    };
  } catch (error) {
    console.error('Investor dashboard error:', error);
    throw error;
  }
}

/**
 * Get basic dashboard for other users
 */
async function getBasicDashboard(user) {
  const resources = await Resource.find({
    visibility: 'Public',
    status: 'Published',
  })
    .sort({ downloadCount: -1 })
    .limit(5)
    .select('title type tags')
    .lean();

  return {
    role: user.role,
    resources,
    actions: [
      { label: 'Browse Resources', link: '/resources' },
    ],
  };
}

/**
 * @route   GET /api/dashboard/recent-activity
 * @desc    Get recent activity feed
 * @access  Protected
 */
router.get('/recent-activity', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent notifications for the user
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: notifications,
    });

  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity',
    });
  }
});

module.exports = router;
