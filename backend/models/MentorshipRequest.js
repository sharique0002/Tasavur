const mongoose = require('mongoose');

/**
 * MentorshipRequest Model
 * Represents a request for mentorship from a startup
 * Includes matching results, scheduling, and feedback
 */
const mentorshipRequestSchema = new mongoose.Schema(
  {
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: [true, 'Startup reference is required'],
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    topic: {
      type: String,
      required: [true, 'Mentorship topic is required'],
      trim: true,
      maxlength: [200, 'Topic cannot exceed 200 characters'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    domains: [{
      type: String,
      enum: [
        'FinTech',
        'HealthTech',
        'EdTech',
        'E-commerce',
        'SaaS',
        'AI/ML',
        'IoT',
        'CleanTech',
        'AgriTech',
        'Other',
      ],
    }],

    skills: {
      type: [{
        type: String,
        trim: true,
      }],
      validate: {
        validator: function (arr) {
          return arr && arr.length >= 1;
        },
        message: 'At least one skill is required',
      },
    },

    urgency: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid urgency level',
      },
      default: 'Medium',
    },

    preferredTimes: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
      timeSlot: String, // e.g., "09:00-11:00"
    }],

    status: {
      type: String,
      enum: {
        values: ['Pending', 'Matched', 'Scheduled', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Pending',
    },

    // Matching results
    matchedMentors: [{
      mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentor',
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      skillMatchScore: Number,
      domainMatchScore: Number,
      availabilityScore: Number,
      ratingScore: Number,
      semanticScore: Number,
      status: {
        type: String,
        enum: ['Suggested', 'Accepted', 'Declined', 'Pending'],
        default: 'Suggested',
      },
      acceptedAt: Date,
      declinedAt: Date,
      declineReason: String,
    }],

    // Selected mentor
    selectedMentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
    },

    // Sessions scheduled
    sessions: [{
      mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentor',
      },
      scheduledAt: {
        type: Date,
        required: true,
      },
      duration: {
        type: Number, // minutes
        default: 60,
        min: 15,
        max: 240,
      },
      meetingLink: String,
      calendarEventId: String,
      status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled'],
        default: 'Scheduled',
      },
      notes: {
        type: String,
        maxlength: 2000,
      },
      // Session outcomes
      actionItems: [{
        description: String,
        completed: { type: Boolean, default: false },
        dueDate: Date,
      }],
      // Founder feedback
      founderFeedback: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: 1000,
        },
        submittedAt: Date,
      },
      // Mentor feedback
      mentorFeedback: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: 1000,
        },
        submittedAt: Date,
      },
    }],

    // Overall rating
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    notes: {
      type: String,
      maxlength: 2000,
    },

    // Cancellation tracking
    cancelledAt: Date,
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

mentorshipRequestSchema.index(
  { startup: 1, status: 1, createdAt: -1 },
  { name: 'startup_status_date_idx' }
);

mentorshipRequestSchema.index(
  { requestedBy: 1, createdAt: -1 },
  { name: 'user_date_idx' }
);

mentorshipRequestSchema.index(
  { 'matchedMentors.mentor': 1 },
  { name: 'matched_mentors_idx' }
);

mentorshipRequestSchema.index(
  { status: 1, urgency: -1, createdAt: -1 },
  { name: 'status_urgency_date_idx' }
);

mentorshipRequestSchema.index(
  { selectedMentor: 1 },
  { name: 'selected_mentor_idx' }
);

// =============================================================================
// VIRTUALS
// =============================================================================

// Total sessions count
mentorshipRequestSchema.virtual('sessionCount').get(function () {
  return this.sessions ? this.sessions.length : 0;
});

// Completed sessions count
mentorshipRequestSchema.virtual('completedSessionCount').get(function () {
  if (!this.sessions) return 0;
  return this.sessions.filter(s => s.status === 'Completed').length;
});

// =============================================================================
// HOOKS
// =============================================================================

// Validate status transitions
mentorshipRequestSchema.pre('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    const validTransitions = {
      'Pending': ['Matched', 'Cancelled'],
      'Matched': ['Scheduled', 'Cancelled', 'Pending'],
      'Scheduled': ['Completed', 'Cancelled'],
      'Completed': [], // Terminal state
      'Cancelled': [], // Terminal state
    };

    const previousStatus = this._previousStatus || 'Pending';
    const allowed = validTransitions[previousStatus] || [];

    if (!allowed.includes(this.status) && this.status !== previousStatus) {
      // Allow the transition but log warning
      console.warn(`⚠️ Unusual status transition: ${previousStatus} -> ${this.status}`);
    }
  }

  // Track previous status for transition validation
  if (this.isModified('status')) {
    this._previousStatus = this.status;
  }

  next();
});

// Track cancellation
mentorshipRequestSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Get completion rate
 * @returns {number} Percentage (0-100)
 */
mentorshipRequestSchema.methods.getCompletionRate = function () {
  if (!this.sessions || this.sessions.length === 0) return 0;

  const completed = this.sessions.filter(s => s.status === 'Completed').length;
  return Math.round((completed / this.sessions.length) * 100);
};

/**
 * Check if request can be cancelled
 * @returns {boolean}
 */
mentorshipRequestSchema.methods.canBeCancelled = function () {
  return ['Pending', 'Matched', 'Scheduled'].includes(this.status);
};

/**
 * Cancel the request
 * @param {ObjectId} cancelledBy - User cancelling
 * @param {string} reason - Cancellation reason
 */
mentorshipRequestSchema.methods.cancel = async function (cancelledBy, reason = '') {
  if (!this.canBeCancelled()) {
    throw new Error('Request cannot be cancelled in current status');
  }

  this.status = 'Cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;

  await this.save();
};

/**
 * Select a mentor from matched list
 * @param {ObjectId} mentorId - Mentor to select
 */
mentorshipRequestSchema.methods.selectMentor = async function (mentorId) {
  const matchedMentor = this.matchedMentors.find(
    m => m.mentor.toString() === mentorId.toString()
  );

  if (!matchedMentor) {
    throw new Error('Mentor not in matched list');
  }

  this.selectedMentor = mentorId;
  matchedMentor.status = 'Accepted';
  matchedMentor.acceptedAt = new Date();

  await this.save();
};

/**
 * Schedule a session
 * @param {Object} sessionData - Session details
 */
mentorshipRequestSchema.methods.scheduleSession = async function (sessionData) {
  const session = {
    mentor: sessionData.mentorId || this.selectedMentor,
    scheduledAt: new Date(sessionData.scheduledAt),
    duration: sessionData.duration || 60,
    meetingLink: sessionData.meetingLink,
    notes: sessionData.notes,
    status: 'Scheduled',
  };

  this.sessions.push(session);

  if (this.status === 'Matched') {
    this.status = 'Scheduled';
  }

  await this.save();
  return this.sessions[this.sessions.length - 1];
};

/**
 * Submit feedback for a session
 * @param {ObjectId} sessionId - Session to update
 * @param {boolean} isFounder - Whether feedback is from founder
 * @param {Object} feedbackData - Feedback details
 */
mentorshipRequestSchema.methods.submitFeedback = async function (sessionId, isFounder, feedbackData) {
  const session = this.sessions.id(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  const feedback = {
    rating: feedbackData.rating,
    comment: feedbackData.comment,
    submittedAt: new Date(),
  };

  if (isFounder) {
    session.founderFeedback = feedback;
  } else {
    session.mentorFeedback = feedback;
  }

  // Mark complete if both feedbacks are in
  if (session.founderFeedback && session.mentorFeedback) {
    session.status = 'Completed';

    // Update mentor rating
    try {
      const Mentor = mongoose.model('Mentor');
      const mentor = await Mentor.findById(session.mentor);
      if (mentor && session.founderFeedback.rating) {
        await mentor.updateRating(session.founderFeedback.rating);
        await mentor.completeSession();
      }
    } catch (error) {
      console.error('Error updating mentor rating:', error.message);
    }
  }

  await this.save();
  return session;
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Get requests needing attention
 * @returns {Promise<MentorshipRequest[]>}
 */
mentorshipRequestSchema.statics.getNeedingAttention = async function () {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  return this.find({
    status: 'Pending',
    createdAt: { $lt: threeDaysAgo },
  })
    .populate('startup', 'name')
    .populate('requestedBy', 'name email')
    .sort({ urgency: -1, createdAt: 1 });
};

/**
 * Get pending requests for a mentor
 * @param {ObjectId} mentorId - Mentor ID
 * @returns {Promise<MentorshipRequest[]>}
 */
mentorshipRequestSchema.statics.getForMentor = function (mentorId) {
  return this.find({
    'matchedMentors.mentor': mentorId,
    status: { $in: ['Matched', 'Scheduled'] },
  })
    .populate('startup', 'name domain stage')
    .populate('requestedBy', 'name email')
    .sort({ createdAt: -1 });
};

/**
 * Get stats for a startup
 * @param {ObjectId} startupId - Startup ID
 * @returns {Promise<Object>}
 */
mentorshipRequestSchema.statics.getStartupStats = async function (startupId) {
  const requests = await this.find({ startup: startupId });

  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    matched: requests.filter(r => r.status === 'Matched').length,
    scheduled: requests.filter(r => r.status === 'Scheduled').length,
    completed: requests.filter(r => r.status === 'Completed').length,
    cancelled: requests.filter(r => r.status === 'Cancelled').length,
    totalSessions: requests.reduce((sum, r) => sum + (r.sessions?.length || 0), 0),
  };
};

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
