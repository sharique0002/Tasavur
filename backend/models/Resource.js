const mongoose = require('mongoose');

/**
 * Resource Model
 * Represents resources in the knowledge hub
 * Includes templates, courses, playbooks, videos, and more
 */
const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['Template', 'Course', 'Playbook', 'Video', 'Article', 'Tool', 'Guide', 'Other'],
        message: '{VALUE} is not a valid resource type',
      },
      default: 'Other',
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Short description for cards
    summary: {
      type: String,
      trim: true,
      maxlength: [300, 'Summary cannot exceed 300 characters'],
    },

    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],

    // Content URLs
    fileUrl: {
      type: String,
      trim: true,
    },

    videoUrl: {
      type: String,
      trim: true,
    },

    externalLink: {
      type: String,
      trim: true,
    },

    thumbnailUrl: {
      type: String,
      trim: true,
    },

    // Creator reference
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },

    // Visibility settings
    visibility: {
      type: String,
      enum: {
        values: ['Public', 'Private', 'Members Only'],
        message: '{VALUE} is not a valid visibility',
      },
      default: 'Public',
    },

    // Target audience
    targetAudience: [{
      type: String,
      enum: ['founder', 'mentor', 'investor', 'admin', 'all'],
    }],

    // Difficulty level
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },

    // Estimated time to consume (minutes)
    estimatedTime: {
      type: Number,
      min: 0,
    },

    // Analytics
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Users who liked
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    // Detailed analytics
    analytics: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      action: {
        type: String,
        enum: ['view', 'download', 'like', 'unlike', 'share'],
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
      },
    }],

    // Featured flag
    featured: {
      type: Boolean,
      default: false,
    },

    // File metadata
    fileSize: {
      type: Number, // bytes
      min: 0,
    },

    format: {
      type: String,
      trim: true,
    },

    // Related resources
    relatedResources: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
    }],

    // Prerequisites
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
    }],

    // Status
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Published',
    },

    // Publishing dates
    publishedAt: {
      type: Date,
    },

    archivedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// Text search index
resourceSchema.index(
  {
    title: 'text',
    description: 'text',
    tags: 'text',
    summary: 'text',
  },
  {
    weights: {
      title: 10,
      tags: 5,
      summary: 3,
      description: 1,
    },
    name: 'resource_text_search',
  }
);

// Filter indexes
resourceSchema.index(
  { type: 1, visibility: 1, status: 1, createdAt: -1 },
  { name: 'type_visibility_status_idx' }
);
resourceSchema.index({ tags: 1 }, { name: 'tags_idx' });
resourceSchema.index(
  { downloadCount: -1, viewCount: -1 },
  { name: 'popularity_idx' }
);
resourceSchema.index({ createdBy: 1 }, { name: 'creator_idx' });
resourceSchema.index({ featured: -1, createdAt: -1 }, { name: 'featured_date_idx' });

// =============================================================================
// VIRTUALS
// =============================================================================

// Popularity score
resourceSchema.virtual('popularityScore').get(function () {
  return (this.downloadCount * 2) + this.viewCount + (this.likeCount * 3);
});

// Has file
resourceSchema.virtual('hasFile').get(function () {
  return !!(this.fileUrl || this.externalLink);
});

// Has video
resourceSchema.virtual('hasVideo').get(function () {
  return !!this.videoUrl;
});

// =============================================================================
// HOOKS
// =============================================================================

// Set publishedAt when status changes to Published
resourceSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'Published' && !this.publishedAt) {
      this.publishedAt = new Date();
    } else if (this.status === 'Archived' && !this.archivedAt) {
      this.archivedAt = new Date();
    }
  }

  // Set summary from description if not provided
  if (!this.summary && this.description) {
    this.summary = this.description.substring(0, 297) + (this.description.length > 297 ? '...' : '');
  }

  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Record a download
 * @param {ObjectId} userId - User who downloaded
 * @returns {Promise<Resource>}
 */
resourceSchema.methods.recordDownload = async function (userId) {
  this.downloadCount += 1;

  if (userId) {
    this.analytics.push({
      user: userId,
      action: 'download',
      timestamp: new Date(),
    });
  }

  await this.save();
  return this;
};

/**
 * Record a view
 * @param {ObjectId} userId - User who viewed (optional)
 * @returns {Promise<Resource>}
 */
resourceSchema.methods.recordView = async function (userId) {
  this.viewCount += 1;

  if (userId) {
    this.analytics.push({
      user: userId,
      action: 'view',
      timestamp: new Date(),
    });
  }

  await this.save();
  return this;
};

/**
 * Toggle like
 * @param {ObjectId} userId - User toggling like
 * @returns {Promise<Object>} Result with liked status
 */
resourceSchema.methods.toggleLike = async function (userId) {
  const isLiked = this.likedBy.some(id => id.toString() === userId.toString());

  if (isLiked) {
    // Unlike
    this.likedBy = this.likedBy.filter(id => id.toString() !== userId.toString());
    this.likeCount = Math.max(0, this.likeCount - 1);
    this.analytics.push({
      user: userId,
      action: 'unlike',
      timestamp: new Date(),
    });
  } else {
    // Like
    this.likedBy.push(userId);
    this.likeCount += 1;
    this.analytics.push({
      user: userId,
      action: 'like',
      timestamp: new Date(),
    });
  }

  await this.save();
  return { liked: !isLiked, likeCount: this.likeCount };
};

/**
 * Check if user has liked
 * @param {ObjectId} userId - User to check
 * @returns {boolean}
 */
resourceSchema.methods.isLikedBy = function (userId) {
  return this.likedBy.some(id => id.toString() === userId.toString());
};

/**
 * Archive the resource
 */
resourceSchema.methods.archive = async function () {
  this.status = 'Archived';
  this.archivedAt = new Date();
  await this.save();
};

/**
 * Publish the resource
 */
resourceSchema.methods.publish = async function () {
  this.status = 'Published';
  this.publishedAt = new Date();
  await this.save();
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Get popular resources
 * @param {number} limit - Number of resources
 * @returns {Promise<Resource[]>}
 */
resourceSchema.statics.getPopular = function (limit = 10) {
  return this.find({
    visibility: { $in: ['Public', 'Members Only'] },
    status: 'Published',
  })
    .sort({ downloadCount: -1, viewCount: -1, likeCount: -1 })
    .limit(limit)
    .populate('createdBy', 'name email role');
};

/**
 * Get featured resources
 * @param {number} limit - Number of resources
 * @returns {Promise<Resource[]>}
 */
resourceSchema.statics.getFeatured = function (limit = 6) {
  return this.find({
    featured: true,
    status: 'Published',
    visibility: { $in: ['Public', 'Members Only'] },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name email role');
};

/**
 * Get analytics summary
 * @returns {Promise<Object>}
 */
resourceSchema.statics.getAnalyticsSummary = async function () {
  const [totalResources, downloadStats, viewStats, typeDistribution] = await Promise.all([
    this.countDocuments({ status: 'Published' }),
    this.aggregate([
      { $match: { status: 'Published' } },
      { $group: { _id: null, total: { $sum: '$downloadCount' } } },
    ]),
    this.aggregate([
      { $match: { status: 'Published' } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } },
    ]),
    this.aggregate([
      { $match: { status: 'Published' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalResources,
    totalDownloads: downloadStats[0]?.total || 0,
    totalViews: viewStats[0]?.total || 0,
    typeDistribution,
  };
};

/**
 * Get resources by tag
 * @param {string} tag - Tag to filter by
 * @param {number} limit - Max results
 * @returns {Promise<Resource[]>}
 */
resourceSchema.statics.getByTag = function (tag, limit = 20) {
  return this.find({
    tags: tag.toLowerCase(),
    status: 'Published',
    visibility: { $in: ['Public', 'Members Only'] },
  })
    .sort({ popularityScore: -1 })
    .limit(limit)
    .populate('createdBy', 'name role');
};

/**
 * Get all unique tags
 * @returns {Promise<string[]>}
 */
resourceSchema.statics.getAllTags = async function () {
  const tags = await this.distinct('tags', {
    status: 'Published',
    visibility: 'Public',
  });
  return tags.sort();
};

module.exports = mongoose.model('Resource', resourceSchema);
