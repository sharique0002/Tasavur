const mongoose = require('mongoose');

/**
 * Notification Model
 * System-wide notification system for users
 * Supports multiple notification types, priorities, and real-time delivery
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },

    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: [
          'startup_created',
          'startup_status_changed',
          'mentorship_request_created',
          'mentorship_matched',
          'mentor_selected',
          'session_scheduled',
          'session_reminder',
          'session_cancelled',
          'feedback_received',
          'feedback_requested',
          'resource_published',
          'funding_application_submitted',
          'funding_status_changed',
          'system_announcement',
          'welcome',
          'password_changed',
          'account_updated',
          'other',
        ],
        message: '{VALUE} is not a valid notification type',
      },
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
    },

    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },

    // Action URL - where to navigate when clicked
    actionUrl: {
      type: String,
      trim: true,
    },

    // Action button text
    actionText: {
      type: String,
      trim: true,
      default: 'View',
    },

    // Related entity
    relatedModel: {
      type: String,
      enum: ['Startup', 'User', 'Mentor', 'MentorshipRequest', 'Resource', 'FundingApplication', null],
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Icon for the notification
    icon: {
      type: String,
      trim: true,
    },

    // Email notification sent
    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: {
      type: Date,
    },

    // Push notification sent
    pushSent: {
      type: Boolean,
      default: false,
    },

    // Expiration date
    expiresAt: {
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

// Main query index
notificationSchema.index(
  { recipient: 1, read: 1, createdAt: -1 },
  { name: 'recipient_read_date_idx' }
);

// Priority filter index
notificationSchema.index(
  { recipient: 1, priority: 1, read: 1 },
  { name: 'recipient_priority_idx' }
);

// Type filter index
notificationSchema.index(
  { recipient: 1, type: 1, createdAt: -1 },
  { name: 'recipient_type_date_idx' }
);

// TTL index for auto-deletion
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_idx' }
);

// Related entity lookup
notificationSchema.index(
  { relatedModel: 1, relatedId: 1 },
  { name: 'related_entity_idx' }
);

// =============================================================================
// VIRTUALS
// =============================================================================

// Time since creation
notificationSchema.virtual('timeAgo').get(function () {
  const seconds = Math.floor((new Date() - this.createdAt) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return this.createdAt.toLocaleDateString();
});

// =============================================================================
// HOOKS
// =============================================================================

// Set expiration date if not set
notificationSchema.pre('save', function (next) {
  if (!this.expiresAt) {
    // Default: 30 days for read, 90 days for unread
    const days = this.read ? 30 : 90;
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  // Update expiry when marked as read
  if (this.isModified('read') && this.read) {
    this.readAt = new Date();
    // Extend expiry to 30 days from now
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (this.expiresAt > new Date(Date.now() + thirtyDays)) {
      this.expiresAt = new Date(Date.now() + thirtyDays);
    }
  }

  // Set default icon based on type
  if (!this.icon && this.isNew) {
    const iconMap = {
      'startup_created': '🚀',
      'startup_status_changed': '📋',
      'mentorship_request_created': '🤝',
      'mentorship_matched': '✅',
      'mentor_selected': '⭐',
      'session_scheduled': '📅',
      'session_reminder': '⏰',
      'session_cancelled': '❌',
      'feedback_received': '💬',
      'feedback_requested': '📝',
      'resource_published': '📚',
      'funding_application_submitted': '💰',
      'funding_status_changed': '📊',
      'system_announcement': '📢',
      'welcome': '👋',
      'password_changed': '🔐',
      'account_updated': '👤',
      'other': '🔔',
    };
    this.icon = iconMap[this.type] || '🔔';
  }

  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Mark notification as read
 * @returns {Promise<Notification>}
 */
notificationSchema.methods.markAsRead = async function () {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

/**
 * Mark notification as unread
 * @returns {Promise<Notification>}
 */
notificationSchema.methods.markAsUnread = async function () {
  if (this.read) {
    this.read = false;
    this.readAt = undefined;
    await this.save();
  }
  return this;
};

/**
 * Check if notification is expired
 * @returns {boolean}
 */
notificationSchema.methods.isExpired = function () {
  return this.expiresAt && this.expiresAt < new Date();
};

/**
 * Record email sent
 */
notificationSchema.methods.recordEmailSent = async function () {
  this.emailSent = true;
  this.emailSentAt = new Date();
  await this.save();
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Get unread count for user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<number>}
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

/**
 * Mark all as read for user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} Update result
 */
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

/**
 * Get notifications for user with pagination
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
notificationSchema.statics.getForUser = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    priority = null,
    type = null,
  } = options;

  const query = { recipient: userId };

  if (unreadOnly) {
    query.read = false;
  }

  if (priority) {
    query.priority = priority;
  }

  if (type) {
    query.type = type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    this.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
    this.countDocuments({ recipient: userId, read: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Delete old read notifications
 * @returns {Promise<Object>} Delete result
 */
notificationSchema.statics.cleanupOldNotifications = async function () {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return this.deleteMany({
    read: true,
    readAt: { $lt: thirtyDaysAgo },
  });
};

/**
 * Create bulk notifications
 * @param {Array} notifications - Array of notification data
 * @returns {Promise<Array>}
 */
notificationSchema.statics.createBulk = async function (notifications) {
  try {
    return await this.insertMany(notifications, { ordered: false });
  } catch (error) {
    // Log but don't fail for partial failures
    console.error('Bulk notification creation partial failure:', error.message);
    return [];
  }
};

/**
 * Get priority notifications for user
 * @param {ObjectId} userId - User ID
 * @param {number} limit - Max notifications
 * @returns {Promise<Array>}
 */
notificationSchema.statics.getPriorityNotifications = async function (userId, limit = 5) {
  return this.find({
    recipient: userId,
    read: false,
    priority: { $in: ['high', 'urgent'] },
  })
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Delete notifications for a related entity
 * @param {string} model - Model name
 * @param {ObjectId} id - Entity ID
 * @returns {Promise<Object>}
 */
notificationSchema.statics.deleteForEntity = async function (model, id) {
  return this.deleteMany({
    relatedModel: model,
    relatedId: id,
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
