const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const Startup = require('../models/Startup');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { handleUpload } = require('../middleware/upload');

/**
 * Startup Routes
 * Handles startup CRUD operations and onboarding
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
 * Parse JSON field safely
 */
const parseJsonField = (value, fieldName) => {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (err) {
    throw new Error(`Invalid ${fieldName} format: must be valid JSON`);
  }
};

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @route   POST /api/startups
 * @desc    Create a new startup (onboarding)
 * @access  Public or Protected (optional auth)
 */
router.post(
  '/',
  optionalAuth,
  handleUpload(upload.single('pitchDeck')),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Startup name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters'),
    body('shortDesc')
      .trim()
      .notEmpty()
      .withMessage('Short description is required')
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('domain')
      .notEmpty()
      .withMessage('Business domain is required')
      .isIn(['FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS', 'AI/ML', 'IoT', 'CleanTech', 'AgriTech', 'Other'])
      .withMessage('Invalid business domain'),
    body('stage')
      .notEmpty()
      .withMessage('Startup stage is required')
      .isIn(['Idea', 'MVP', 'Early-Stage', 'Growth', 'Scale-up'])
      .withMessage('Invalid startup stage'),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formatErrors(errors),
        });
      }

      const { name, shortDesc, domain, stage, founders, contact, website, tags } = req.body;

      // Parse founders
      let parsedFounders;
      try {
        parsedFounders = parseJsonField(founders, 'founders');
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Validate founders
      if (!parsedFounders || !Array.isArray(parsedFounders) || parsedFounders.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one founder is required',
          errors: [{ field: 'founders', message: 'At least one founder is required' }],
        });
      }

      // Validate each founder
      for (let i = 0; i < parsedFounders.length; i++) {
        const founder = parsedFounders[i];

        if (!founder.name || founder.name.trim() === '') {
          return res.status(400).json({
            success: false,
            message: `Founder ${i + 1}: Name is required`,
            errors: [{ field: `founders[${i}].name`, message: 'Name is required' }],
          });
        }

        if (!founder.email || !/^\S+@\S+\.\S+$/.test(founder.email)) {
          return res.status(400).json({
            success: false,
            message: `Founder ${i + 1}: Valid email is required`,
            errors: [{ field: `founders[${i}].email`, message: 'Valid email is required' }],
          });
        }
      }

      // Parse contact
      let parsedContact;
      try {
        parsedContact = parseJsonField(contact, 'contact');
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Validate contact email
      if (!parsedContact || !parsedContact.email || !/^\S+@\S+\.\S+$/.test(parsedContact.email)) {
        return res.status(400).json({
          success: false,
          message: 'Valid contact email is required',
          errors: [{ field: 'contact.email', message: 'Valid email is required' }],
        });
      }

      // Build startup data
      const startupData = {
        name: name.trim(),
        shortDesc: shortDesc.trim(),
        domain,
        stage,
        founders: parsedFounders,
        contact: parsedContact,
        website: website?.trim(),
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        status: 'Pending',
      };

      // Add founder reference if authenticated
      if (req.user) {
        startupData.founder = req.user._id;
      }

      // Add pitch deck URL if file uploaded
      if (req.file) {
        startupData.pitchDeckUrl = req.file.location || `/uploads/pitchdecks/${req.file.filename}`;
      }

      // Create startup
      const startup = await Startup.create(startupData);

      // Update user's startup reference if authenticated
      if (req.user) {
        req.user.startup = startup._id;
        await req.user.save();
      }

      res.status(201).json({
        success: true,
        message: 'Startup created successfully! Your application is pending review.',
        data: startup,
      });

    } catch (error) {
      console.error('Create startup error:', error);

      // Handle duplicate name error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'A startup with this name already exists',
          code: 'DUPLICATE_NAME',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating startup',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   GET /api/startups
 * @desc    Get all startups (with filters)
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
    query('domain').optional().isString(),
    query('stage').optional().isString(),
    query('status').optional().isString(),
    query('search').optional().isString(),
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

      const {
        domain,
        stage,
        status,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // Build filter
      const filter = {};

      if (domain) filter.domain = domain;
      if (stage) filter.stage = stage;
      if (status) filter.status = status;

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { shortDesc: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ];
      }

      // Build sort
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const [startups, count] = await Promise.all([
        Startup.find(filter)
          .populate('founder', 'name email avatar')
          .populate('mentors', 'name expertise rating')
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .sort(sortOptions)
          .lean(),
        Startup.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        data: startups,
      });

    } catch (error) {
      console.error('Get startups error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching startups',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   GET /api/startups/:id
 * @desc    Get single startup by ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid startup ID'),
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

      const startup = await Startup.findById(req.params.id)
        .populate('founder', 'name email avatar bio')
        .populate('mentors', 'name expertise avatar rating company');

      if (!startup) {
        return res.status(404).json({
          success: false,
          message: 'Startup not found',
        });
      }

      res.status(200).json({
        success: true,
        data: startup,
      });

    } catch (error) {
      console.error('Get startup error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching startup',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   PUT /api/startups/:id
 * @desc    Update startup details
 * @access  Protected (Founder or Admin)
 */
router.put(
  '/:id',
  protect,
  handleUpload(upload.single('pitchDeck')),
  [
    param('id').isMongoId().withMessage('Invalid startup ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('shortDesc').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
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

      let startup = await Startup.findById(req.params.id);

      if (!startup) {
        return res.status(404).json({
          success: false,
          message: 'Startup not found',
        });
      }

      // Check authorization
      const isOwner = startup.founder && startup.founder.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this startup',
        });
      }

      // Build update object
      const allowedFields = ['name', 'shortDesc', 'domain', 'stage', 'website', 'tags', 'notes'];
      const updates = {};

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Handle founders update
      if (req.body.founders) {
        try {
          updates.founders = parseJsonField(req.body.founders, 'founders');
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
      }

      // Handle contact update
      if (req.body.contact) {
        try {
          updates.contact = parseJsonField(req.body.contact, 'contact');
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
      }

      // Handle KPIs update (admin or owner)
      if (req.body.kpis) {
        try {
          updates.kpis = parseJsonField(req.body.kpis, 'kpis');
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
      }

      // Handle status update (admin only)
      if (req.body.status && isAdmin) {
        updates.status = req.body.status;
      }

      // Handle pitch deck upload
      if (req.file) {
        updates.pitchDeckUrl = req.file.location || `/uploads/pitchdecks/${req.file.filename}`;
      }

      // Update startup
      startup = await Startup.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      )
        .populate('founder', 'name email')
        .populate('mentors', 'name expertise');

      res.status(200).json({
        success: true,
        message: 'Startup updated successfully',
        data: startup,
      });

    } catch (error) {
      console.error('Update startup error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating startup',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   DELETE /api/startups/:id
 * @desc    Delete a startup
 * @access  Protected (Admin only)
 */
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid startup ID'),
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

      const startup = await Startup.findById(req.params.id);

      if (!startup) {
        return res.status(404).json({
          success: false,
          message: 'Startup not found',
        });
      }

      // Delete the startup (pre-delete hook will clean up related data)
      await startup.deleteOne();

      // Clear startup reference from founder user
      if (startup.founder) {
        const User = require('../models/User');
        await User.findByIdAndUpdate(startup.founder, { $unset: { startup: 1 } });
      }

      res.status(200).json({
        success: true,
        message: 'Startup deleted successfully',
      });

    } catch (error) {
      console.error('Delete startup error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting startup',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   PUT /api/startups/:id/status
 * @desc    Update startup status (admin only)
 * @access  Protected (Admin)
 */
router.put(
  '/:id/status',
  protect,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid startup ID'),
    body('status')
      .isIn(['Pending', 'Approved', 'Rejected', 'Active', 'Graduated', 'Inactive'])
      .withMessage('Invalid status'),
    body('reason').optional().isString(),
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

      const startup = await Startup.findById(req.params.id);

      if (!startup) {
        return res.status(404).json({
          success: false,
          message: 'Startup not found',
        });
      }

      const { status, reason } = req.body;

      // Update status with history tracking
      await startup.updateStatus(status, req.user._id, reason);

      res.status(200).json({
        success: true,
        message: `Startup status updated to ${status}`,
        data: startup,
      });

    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
