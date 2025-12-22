const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const FundingApplication = require('../models/FundingApplication');
const Startup = require('../models/Startup');
const { protect, authorize } = require('../middleware/auth');

/**
 * Funding Routes
 * Handles funding applications from startups
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatErrors = (errors) => {
  return errors.array().map(err => ({
    field: err.path || err.param,
    message: err.msg,
  }));
};

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @route   POST /api/funding/applications
 * @desc    Create a new funding application
 * @access  Protected (founders)
 */
router.post(
  '/applications',
  protect,
  [
    body('startupId').notEmpty().withMessage('Startup ID is required'),
    body('roundType')
      .isIn(['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Bridge', 'Grant', 'Other'])
      .withMessage('Invalid round type'),
    body('amountRequested')
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom(val => val > 0)
      .withMessage('Amount must be positive'),
    body('purpose')
      .notEmpty()
      .withMessage('Purpose is required')
      .isLength({ max: 2000 })
      .withMessage('Purpose cannot exceed 2000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formatErrors(errors),
        });
      }

      const { startupId, roundType, amountRequested, currency, purpose, useOfFunds, currentMetrics, milestones, timeline } = req.body;

      // Verify startup exists and user has access
      const startup = await Startup.findById(startupId);
      if (!startup) {
        return res.status(404).json({
          success: false,
          message: 'Startup not found',
        });
      }

      // Check if user is admin or founder of this startup
      const isAdmin = req.user.role === 'admin';
      const isFounder = startup.founders?.some(f => f.email === req.user.email) || 
                        startup.user?.toString() === req.user._id.toString();

      if (!isAdmin && !isFounder) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to apply for funding for this startup',
        });
      }

      // Create application
      const application = await FundingApplication.create({
        startup: startupId,
        applicant: req.user._id,
        roundType,
        amountRequested,
        currency: currency || 'USD',
        purpose,
        useOfFunds: useOfFunds || { breakdown: [], totalAllocated: 0 },
        currentMetrics: currentMetrics || {},
        milestones: milestones || [],
        timeline: timeline || {},
        status: 'Draft',
      });

      await application.populate([
        { path: 'startup', select: 'name domain stage' },
        { path: 'applicant', select: 'name email' },
      ]);

      res.status(201).json({
        success: true,
        message: 'Funding application created successfully',
        data: application,
      });

    } catch (error) {
      console.error('Create funding application error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating funding application',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   GET /api/funding/applications
 * @desc    Get all funding applications (filtered by user role)
 * @access  Protected
 */
router.get(
  '/applications',
  protect,
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status, roundType, startupId } = req.query;

      let filter = {};

      // Admins see all, others see only their own
      if (req.user.role !== 'admin') {
        filter.applicant = req.user._id;
      }

      if (status) filter.status = status;
      if (roundType) filter.roundType = roundType;
      if (startupId) filter.startup = startupId;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [applications, total] = await Promise.all([
        FundingApplication.find(filter)
          .populate('startup', 'name domain stage')
          .populate('applicant', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        FundingApplication.countDocuments(filter),
      ]);

      res.json({
        success: true,
        count: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        data: applications,
      });

    } catch (error) {
      console.error('Get funding applications error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching funding applications',
      });
    }
  }
);

/**
 * @route   GET /api/funding/applications/:id
 * @desc    Get single funding application
 * @access  Protected
 */
router.get(
  '/applications/:id',
  protect,
  async (req, res) => {
    try {
      const application = await FundingApplication.findById(req.params.id)
        .populate('startup', 'name domain stage shortDesc founders contact kpis')
        .populate('applicant', 'name email')
        .populate('reviews.reviewer', 'name email');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Funding application not found',
        });
      }

      // Check access
      const isAdmin = req.user.role === 'admin';
      const isOwner = application.applicant._id.toString() === req.user._id.toString();

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this application',
        });
      }

      res.json({
        success: true,
        data: application,
      });

    } catch (error) {
      console.error('Get funding application error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching funding application',
      });
    }
  }
);

/**
 * @route   PUT /api/funding/applications/:id
 * @desc    Update funding application
 * @access  Protected (owner only, draft status only)
 */
router.put(
  '/applications/:id',
  protect,
  async (req, res) => {
    try {
      const application = await FundingApplication.findById(req.params.id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Funding application not found',
        });
      }

      // Only owner can update, and only if in Draft status
      if (application.applicant.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this application',
        });
      }

      if (application.status !== 'Draft') {
        return res.status(400).json({
          success: false,
          message: 'Can only update applications in Draft status',
        });
      }

      const allowedUpdates = ['roundType', 'amountRequested', 'currency', 'purpose', 'useOfFunds', 'currentMetrics', 'milestones', 'timeline'];
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          application[field] = req.body[field];
        }
      });

      await application.save();
      await application.populate([
        { path: 'startup', select: 'name domain stage' },
        { path: 'applicant', select: 'name email' },
      ]);

      res.json({
        success: true,
        message: 'Application updated successfully',
        data: application,
      });

    } catch (error) {
      console.error('Update funding application error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating funding application',
      });
    }
  }
);

/**
 * @route   POST /api/funding/applications/:id/submit
 * @desc    Submit funding application for review
 * @access  Protected (owner only)
 */
router.post(
  '/applications/:id/submit',
  protect,
  async (req, res) => {
    try {
      const application = await FundingApplication.findById(req.params.id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Funding application not found',
        });
      }

      if (application.applicant.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to submit this application',
        });
      }

      if (application.status !== 'Draft') {
        return res.status(400).json({
          success: false,
          message: 'Application has already been submitted',
        });
      }

      application.status = 'Submitted';
      application.submittedAt = new Date();
      await application.save();

      await application.populate([
        { path: 'startup', select: 'name domain stage' },
        { path: 'applicant', select: 'name email' },
      ]);

      res.json({
        success: true,
        message: 'Application submitted successfully',
        data: application,
      });

    } catch (error) {
      console.error('Submit funding application error:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting funding application',
      });
    }
  }
);

/**
 * @route   POST /api/funding/applications/:id/withdraw
 * @desc    Withdraw funding application
 * @access  Protected (owner only)
 */
router.post(
  '/applications/:id/withdraw',
  protect,
  async (req, res) => {
    try {
      const application = await FundingApplication.findById(req.params.id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Funding application not found',
        });
      }

      if (application.applicant.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to withdraw this application',
        });
      }

      if (['Approved', 'Rejected', 'Withdrawn'].includes(application.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot withdraw application in current status',
        });
      }

      application.status = 'Withdrawn';
      application.withdrawalReason = req.body.reason || 'No reason provided';
      await application.save();

      res.json({
        success: true,
        message: 'Application withdrawn successfully',
        data: application,
      });

    } catch (error) {
      console.error('Withdraw funding application error:', error);
      res.status(500).json({
        success: false,
        message: 'Error withdrawing funding application',
      });
    }
  }
);

/**
 * @route   GET /api/funding/statistics
 * @desc    Get funding statistics (admin only)
 * @access  Protected (admin)
 */
router.get(
  '/statistics',
  protect,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }

      const [
        totalApplications,
        statusCounts,
        roundTypeCounts,
        totalRequested,
        totalApproved,
      ] = await Promise.all([
        FundingApplication.countDocuments(),
        FundingApplication.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        FundingApplication.aggregate([
          { $group: { _id: '$roundType', count: { $sum: 1 } } },
        ]),
        FundingApplication.aggregate([
          { $group: { _id: null, total: { $sum: '$amountRequested' } } },
        ]),
        FundingApplication.aggregate([
          { $match: { status: 'Approved' } },
          { $group: { _id: null, total: { $sum: '$amountApproved' } } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          totalApplications,
          statusBreakdown: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
          roundTypeBreakdown: roundTypeCounts.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
          totalAmountRequested: totalRequested[0]?.total || 0,
          totalAmountApproved: totalApproved[0]?.total || 0,
        },
      });

    } catch (error) {
      console.error('Get funding statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching funding statistics',
      });
    }
  }
);

module.exports = router;
