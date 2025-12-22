const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const Resource = require('../models/Resource');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadResource, handleUpload } = require('../middleware/upload');

/**
 * Resource Routes
 * Handles resource CRUD, search, and analytics
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

// =============================================================================
// PUBLIC ROUTES (accessed before protected routes)
// =============================================================================

/**
 * @route   GET /api/resources/popular
 * @desc    Get popular resources
 * @access  Public
 */
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const resources = await Resource.getPopular(limit);

    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });

  } catch (error) {
    console.error('Get popular resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular resources',
    });
  }
});

/**
 * @route   GET /api/resources/featured
 * @desc    Get featured resources
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const resources = await Resource.getFeatured(limit);

    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });

  } catch (error) {
    console.error('Get featured resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured resources',
    });
  }
});

/**
 * @route   GET /api/resources/tags
 * @desc    Get all unique tags
 * @access  Public
 */
router.get('/tags', async (req, res) => {
  try {
    const tags = await Resource.getAllTags();

    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags,
    });

  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tags',
    });
  }
});

/**
 * @route   GET /api/resources/analytics
 * @desc    Get resource analytics summary
 * @access  Protected (Admin, Mentor)
 */
router.get('/analytics', protect, authorize('admin', 'mentor'), async (req, res) => {
  try {
    const analytics = await Resource.getAnalyticsSummary();

    res.status(200).json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
    });
  }
});

// =============================================================================
// MAIN ROUTES
// =============================================================================

/**
 * @route   GET /api/resources
 * @desc    Get all resources (with filters)
 * @access  Public (with optional auth for members-only content)
 */
router.get(
  '/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
    query('type').optional().isString(),
    query('tag').optional().isString(),
    query('search').optional().isString(),
    query('sort').optional().isIn(['newest', 'popular', 'downloads']).withMessage('Invalid sort option'),
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
        type,
        tag,
        search,
        sort = 'newest',
        page = 1,
        limit = 10,
        difficulty,
      } = req.query;

      // Build filter
      const filter = {
        status: 'Published',
      };

      // Visibility filter based on auth status
      if (req.user) {
        // Logged in users can see Public and Members Only
        filter.visibility = { $in: ['Public', 'Members Only'] };
      } else {
        // Public only for unauthenticated users
        filter.visibility = 'Public';
      }

      if (type) {
        filter.type = type;
      }

      if (tag) {
        filter.tags = tag.toLowerCase();
      }

      if (difficulty) {
        filter.difficulty = difficulty;
      }

      if (search) {
        filter.$text = { $search: search };
      }

      // Build sort options
      let sortOptions = {};
      switch (sort) {
        case 'popular':
          sortOptions = { viewCount: -1, downloadCount: -1 };
          break;
        case 'downloads':
          sortOptions = { downloadCount: -1 };
          break;
        case 'newest':
        default:
          sortOptions = { createdAt: -1 };
      }

      // Execute query
      const [resources, count] = await Promise.all([
        Resource.find(filter)
          .populate('createdBy', 'name email role avatar')
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .sort(sortOptions)
          .lean(),
        Resource.countDocuments(filter),
      ]);

      // Add user-specific info if authenticated
      if (req.user) {
        resources.forEach(resource => {
          resource.isLiked = resource.likedBy?.some(
            id => id.toString() === req.user._id.toString()
          );
        });
      }

      res.status(200).json({
        success: true,
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        data: resources,
      });

    } catch (error) {
      console.error('Get resources error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching resources',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   GET /api/resources/:id
 * @desc    Get single resource
 * @access  Public (with visibility check)
 */
router.get(
  '/:id',
  optionalAuth,
  [param('id').isMongoId().withMessage('Invalid resource ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const resource = await Resource.findById(req.params.id)
        .populate('createdBy', 'name email role avatar')
        .populate('relatedResources', 'title type tags');

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Check visibility
      if (resource.visibility === 'Private') {
        if (!req.user || resource.createdBy._id.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'This resource is private',
          });
        }
      }

      if (resource.visibility === 'Members Only' && !req.user) {
        return res.status(401).json({
          success: false,
          message: 'Please login to access this resource',
        });
      }

      // Record view
      await resource.recordView(req.user?._id);

      // Add user-specific info
      const responseData = resource.toObject();
      if (req.user) {
        responseData.isLiked = resource.isLikedBy(req.user._id);
      }

      res.status(200).json({
        success: true,
        data: responseData,
      });

    } catch (error) {
      console.error('Get resource error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching resource',
      });
    }
  }
);

/**
 * @route   POST /api/resources
 * @desc    Create new resource
 * @access  Protected (Admin, Mentor)
 */
router.post(
  '/',
  protect,
  authorize('admin', 'mentor'),
  handleUpload(uploadResource.single('file')),
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('type')
      .isIn(['Template', 'Course', 'Playbook', 'Video', 'Article', 'Tool', 'Guide', 'Other'])
      .withMessage('Invalid resource type'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('visibility')
      .optional()
      .isIn(['Public', 'Private', 'Members Only'])
      .withMessage('Invalid visibility option'),
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

      const {
        title,
        type,
        description,
        tags,
        visibility,
        difficulty,
        estimatedTime,
        videoUrl,
        externalLink,
        thumbnailUrl,
        targetAudience,
      } = req.body;

      // Build resource data
      const resourceData = {
        title: title.trim(),
        type,
        description: description.trim(),
        tags: tags?.map(t => t.toLowerCase().trim()) || [],
        visibility: visibility || 'Public',
        difficulty: difficulty || 'Beginner',
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
        videoUrl,
        externalLink,
        thumbnailUrl,
        targetAudience: targetAudience || ['all'],
        createdBy: req.user._id,
        status: 'Published',
      };

      // Add file URL if uploaded
      if (req.file) {
        resourceData.fileUrl = req.file.location || `/uploads/resources/${req.file.filename}`;
        resourceData.fileSize = req.file.size;
        resourceData.format = req.file.mimetype;
      }

      const resource = await Resource.create(resourceData);
      await resource.populate('createdBy', 'name email role');

      res.status(201).json({
        success: true,
        message: 'Resource created successfully',
        data: resource,
      });

    } catch (error) {
      console.error('Create resource error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating resource',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   PUT /api/resources/:id
 * @desc    Update resource
 * @access  Protected (Creator or Admin)
 */
router.put(
  '/:id',
  protect,
  handleUpload(uploadResource.single('file')),
  [
    param('id').isMongoId().withMessage('Invalid resource ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
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

      let resource = await Resource.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Check authorization
      const isCreator = resource.createdBy.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this resource',
        });
      }

      // Allowed update fields
      const allowedFields = [
        'title', 'type', 'description', 'tags', 'visibility',
        'difficulty', 'estimatedTime', 'videoUrl', 'externalLink',
        'thumbnailUrl', 'targetAudience', 'status', 'featured',
      ];

      const updates = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Process tags
      if (updates.tags && Array.isArray(updates.tags)) {
        updates.tags = updates.tags.map(t => t.toLowerCase().trim());
      }

      // Handle file upload
      if (req.file) {
        updates.fileUrl = req.file.location || `/uploads/resources/${req.file.filename}`;
        updates.fileSize = req.file.size;
        updates.format = req.file.mimetype;
      }

      resource = await Resource.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email role');

      res.status(200).json({
        success: true,
        message: 'Resource updated successfully',
        data: resource,
      });

    } catch (error) {
      console.error('Update resource error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating resource',
      });
    }
  }
);

/**
 * @route   DELETE /api/resources/:id
 * @desc    Delete resource
 * @access  Protected (Creator or Admin)
 */
router.delete(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid resource ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const resource = await Resource.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Check authorization
      const isCreator = resource.createdBy.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this resource',
        });
      }

      await resource.deleteOne();

      res.status(200).json({
        success: true,
        message: 'Resource deleted successfully',
      });

    } catch (error) {
      console.error('Delete resource error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting resource',
      });
    }
  }
);

/**
 * @route   POST /api/resources/:id/download
 * @desc    Record download and get download URL
 * @access  Public (with optional auth)
 */
router.post(
  '/:id/download',
  optionalAuth,
  [param('id').isMongoId().withMessage('Invalid resource ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const resource = await Resource.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Check visibility
      if (resource.visibility === 'Members Only' && !req.user) {
        return res.status(401).json({
          success: false,
          message: 'Please login to download this resource',
        });
      }

      if (!resource.fileUrl && !resource.externalLink) {
        return res.status(400).json({
          success: false,
          message: 'No downloadable file available',
        });
      }

      // Record download
      await resource.recordDownload(req.user?._id);

      res.status(200).json({
        success: true,
        data: {
          downloadUrl: resource.fileUrl || resource.externalLink,
          fileName: resource.title,
        },
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing download',
      });
    }
  }
);

/**
 * @route   POST /api/resources/:id/like
 * @desc    Toggle like on resource
 * @access  Protected
 */
router.post(
  '/:id/like',
  protect,
  [param('id').isMongoId().withMessage('Invalid resource ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatErrors(errors),
        });
      }

      const resource = await Resource.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      const result = await resource.toggleLike(req.user._id);

      res.status(200).json({
        success: true,
        message: result.liked ? 'Resource liked' : 'Resource unliked',
        data: result,
      });

    } catch (error) {
      console.error('Like error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing like',
      });
    }
  }
);

module.exports = router;
