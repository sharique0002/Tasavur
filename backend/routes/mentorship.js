const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const MentorshipRequest = require('../models/MentorshipRequest');
const Mentor = require('../models/Mentor');
const Startup = require('../models/Startup');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { matchMentors, getAIRecommendationSummary } = require('../services/matchingService');

/**
 * Mentorship Routes
 * Handles mentorship requests, matching, scheduling, and feedback
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format validation errors
 */
const formatErrors = (errors) => {
  return errors.array().map(err => ({
    field: err.path || err.param,
    message: err.msg,
  }));
};

/**
 * Send notification helper
 */
const sendNotification = async (recipientId, type, title, message, relatedModel, relatedId) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedModel,
      relatedId,
    });
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
};

// =============================================================================
// MENTOR ROUTES
// =============================================================================

/**
 * @route   GET /api/mentorship/mentors
 * @desc    Get available mentors
 * @access  Protected
 */
router.get('/mentors', protect, async (req, res) => {
  try {
    const { domain, expertise, availability, search, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };

    if (domain) {
      filter.domains = domain;
    }

    if (expertise) {
      filter.expertise = { $regex: expertise, $options: 'i' };
    }

    if (availability) {
      filter.availability = availability;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { expertise: { $regex: search, $options: 'i' } },
      ];
    }

    const [mentors, count] = await Promise.all([
      Mentor.find(filter)
        .populate('user', 'name email avatar')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ rating: -1 })
        .lean(),
      Mentor.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: mentors,
    });

  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mentors',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/mentorship/mentors/:id
 * @desc    Get single mentor details
 * @access  Protected
 */
router.get(
  '/mentors/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid mentor ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const mentor = await Mentor.findById(req.params.id)
        .populate('user', 'name email avatar bio')
        .populate('currentMentees', 'name domain stage');

      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: 'Mentor not found',
        });
      }

      res.status(200).json({
        success: true,
        data: mentor,
      });

    } catch (error) {
      console.error('Get mentor error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching mentor',
      });
    }
  }
);

// =============================================================================
// MENTORSHIP REQUEST ROUTES
// =============================================================================

/**
 * @route   POST /api/mentorship/requests
 * @desc    Create new mentorship request
 * @access  Protected (Founders)
 */
router.post(
  '/requests',
  protect,
  authorize('founder', 'admin'),
  [
    body('topic')
      .trim()
      .notEmpty()
      .withMessage('Topic is required')
      .isLength({ max: 200 })
      .withMessage('Topic cannot exceed 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('skills')
      .isArray({ min: 1 })
      .withMessage('At least one skill is required'),
    body('domains')
      .optional()
      .isArray()
      .withMessage('Domains must be an array'),
    body('urgency')
      .optional()
      .isIn(['Low', 'Medium', 'High', 'Critical'])
      .withMessage('Invalid urgency level'),
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

      // Get user's startup
      const startup = await Startup.findById(req.user.startup);
      if (!startup) {
        return res.status(400).json({
          success: false,
          message: 'You must have a registered startup to request mentorship',
          code: 'NO_STARTUP',
        });
      }

      // Check if startup is active
      if (!['Approved', 'Active'].includes(startup.status)) {
        return res.status(400).json({
          success: false,
          message: 'Your startup must be approved to request mentorship',
          code: 'STARTUP_NOT_APPROVED',
        });
      }

      const { topic, description, skills, domains, urgency, preferredTimes } = req.body;

      // Create the request
      const request = await MentorshipRequest.create({
        startup: startup._id,
        requestedBy: req.user._id,
        topic,
        description,
        skills,
        domains: domains || [startup.domain],
        urgency: urgency || 'Medium',
        preferredTimes: preferredTimes || [],
        status: 'Pending',
      });

      // Trigger mentor matching
      const mentors = await Mentor.find({
        isActive: true,
        availability: { $ne: 'Unavailable' },
      });

      if (mentors.length > 0) {
        try {
          const matches = await matchMentors(request, mentors);

          // Store top matches (limit to 10)
          request.matchedMentors = matches.slice(0, 10);

          // Get AI recommendation if available
          const aiSummary = await getAIRecommendationSummary(request, matches);
          if (aiSummary) {
            request.notes = aiSummary;
          }

          if (matches.length > 0) {
            request.status = 'Matched';
          }

          await request.save();

          // Notify matched mentors
          for (const match of matches.slice(0, 3)) {
            await sendNotification(
              match.mentorData.user,
              'mentorship_request_created',
              'New Mentorship Request',
              `${startup.name} is looking for mentorship in ${topic}`,
              'MentorshipRequest',
              request._id
            );
          }
        } catch (matchError) {
          console.error('Matching error:', matchError);
          // Continue without matches
        }
      }

      // Populate response
      await request.populate('matchedMentors.mentor', 'name expertise rating avatar');

      res.status(201).json({
        success: true,
        message: 'Mentorship request created successfully',
        data: request,
      });

    } catch (error) {
      console.error('Create request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating mentorship request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   GET /api/mentorship/requests
 * @desc    Get mentorship requests (filtered by role)
 * @access  Protected
 */
router.get('/requests', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter = {};

    // Role-based filtering
    if (req.user.role === 'founder') {
      // Founders see only their startup's requests
      if (req.user.startup) {
        filter.startup = req.user.startup;
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }
    } else if (req.user.role === 'mentor') {
      // Mentors see requests they're matched with
      const mentor = await Mentor.findOne({ user: req.user._id });
      if (mentor) {
        filter['matchedMentors.mentor'] = mentor._id;
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }
    }
    // Admins see all

    if (status) {
      filter.status = status;
    }

    const [requests, count] = await Promise.all([
      MentorshipRequest.find(filter)
        .populate('startup', 'name domain stage')
        .populate('requestedBy', 'name email')
        .populate('selectedMentor', 'name expertise rating')
        .populate('matchedMentors.mentor', 'name expertise rating avatar')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      MentorshipRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: requests,
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
    });
  }
});

/**
 * @route   GET /api/mentorship/requests/:id
 * @desc    Get single mentorship request
 * @access  Protected
 */
router.get(
  '/requests/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid request ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const request = await MentorshipRequest.findById(req.params.id)
        .populate('startup', 'name domain stage founders')
        .populate('requestedBy', 'name email avatar')
        .populate('selectedMentor', 'name expertise rating avatar bio')
        .populate('matchedMentors.mentor', 'name expertise rating avatar bio company')
        .populate('sessions.mentor', 'name');

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found',
        });
      }

      res.status(200).json({
        success: true,
        data: request,
      });

    } catch (error) {
      console.error('Get request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching request',
      });
    }
  }
);

/**
 * @route   POST /api/mentorship/requests/:id/select-mentor
 * @desc    Select a mentor from matched list
 * @access  Protected (Founders)
 */
router.post(
  '/requests/:id/select-mentor',
  protect,
  authorize('founder', 'admin'),
  [
    param('id').isMongoId().withMessage('Invalid request ID'),
    body('mentorId').isMongoId().withMessage('Invalid mentor ID'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const request = await MentorshipRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found',
        });
      }

      // Verify ownership (if founder)
      if (req.user.role === 'founder') {
        const startup = await Startup.findById(request.startup);
        if (!startup || startup.founder.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized',
          });
        }
      }

      // Select the mentor
      await request.selectMentor(req.body.mentorId);

      // Get mentor details for notification
      const mentor = await Mentor.findById(req.body.mentorId).populate('user', 'name');

      // Notify the mentor
      if (mentor) {
        await sendNotification(
          mentor.user._id,
          'mentor_selected',
          'You have been selected!',
          `A startup has selected you for mentorship in "${request.topic}"`,
          'MentorshipRequest',
          request._id
        );

        // Add startup to mentor's mentees
        await mentor.addMentee(request.startup);
      }

      await request.populate('selectedMentor', 'name expertise rating');

      res.status(200).json({
        success: true,
        message: 'Mentor selected successfully',
        data: request,
      });

    } catch (error) {
      console.error('Select mentor error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error selecting mentor',
      });
    }
  }
);

/**
 * @route   POST /api/mentorship/requests/:id/schedule
 * @desc    Schedule a mentorship session
 * @access  Protected
 */
router.post(
  '/requests/:id/schedule',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid request ID'),
    body('scheduledAt')
      .isISO8601()
      .withMessage('Valid date is required')
      .custom((value) => {
        if (new Date(value) < new Date()) {
          throw new Error('Date must be in the future');
        }
        return true;
      }),
    body('duration')
      .optional()
      .isInt({ min: 15, max: 240 })
      .withMessage('Duration must be 15-240 minutes'),
    body('meetingLink')
      .optional()
      .isURL()
      .withMessage('Valid meeting link URL required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const request = await MentorshipRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found',
        });
      }

      if (!request.selectedMentor) {
        return res.status(400).json({
          success: false,
          message: 'Please select a mentor first',
        });
      }

      const { scheduledAt, duration, meetingLink, notes } = req.body;

      // Schedule the session
      const session = await request.scheduleSession({
        scheduledAt,
        duration,
        meetingLink,
        notes,
      });

      // Notify both parties
      const startup = await Startup.findById(request.startup);
      const mentor = await Mentor.findById(request.selectedMentor).populate('user');

      if (mentor) {
        await sendNotification(
          mentor.user._id,
          'session_scheduled',
          'Session Scheduled',
          `Session with ${startup?.name || 'Startup'} scheduled for ${new Date(scheduledAt).toLocaleString()}`,
          'MentorshipRequest',
          request._id
        );
      }

      await sendNotification(
        request.requestedBy,
        'session_scheduled',
        'Session Scheduled',
        `Your mentorship session is scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        'MentorshipRequest',
        request._id
      );

      res.status(200).json({
        success: true,
        message: 'Session scheduled successfully',
        data: {
          request,
          session,
        },
      });

    } catch (error) {
      console.error('Schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Error scheduling session',
      });
    }
  }
);

/**
 * @route   POST /api/mentorship/requests/:id/feedback
 * @desc    Submit feedback for a session
 * @access  Protected
 */
router.post(
  '/requests/:id/feedback',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid request ID'),
    body('sessionId').isMongoId().withMessage('Session ID required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be 1-5'),
    body('comment')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Comment cannot exceed 1000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const request = await MentorshipRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found',
        });
      }

      const { sessionId, rating, comment } = req.body;

      // Determine if user is founder or mentor
      let isFounder = false;
      if (req.user.role === 'founder') {
        const startup = await Startup.findById(request.startup);
        isFounder = startup && startup.founder.toString() === req.user._id.toString();
      }

      // Submit feedback
      const session = await request.submitFeedback(sessionId, isFounder, {
        rating,
        comment,
      });

      res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: session,
      });

    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error submitting feedback',
      });
    }
  }
);

/**
 * @route   POST /api/mentorship/requests/:id/cancel
 * @desc    Cancel a mentorship request
 * @access  Protected
 */
router.post(
  '/requests/:id/cancel',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid request ID'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const request = await MentorshipRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found',
        });
      }

      // Verify ownership
      if (req.user.role === 'founder') {
        const startup = await Startup.findById(request.startup);
        if (!startup || startup.founder.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized',
          });
        }
      }

      // Cancel the request
      await request.cancel(req.user._id, req.body.reason);

      res.status(200).json({
        success: true,
        message: 'Request cancelled',
        data: request,
      });

    } catch (error) {
      console.error('Cancel error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error cancelling request',
      });
    }
  }
);

module.exports = router;
