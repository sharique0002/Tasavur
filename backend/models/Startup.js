const mongoose = require('mongoose');

/**
 * Startup Model
 * Represents a startup entity in the incubator platform
 * Includes onboarding data, KPIs, mentor assignments, and status tracking
 */
const startupSchema = new mongoose.Schema(
  {
    // Reference to the user who created this startup (optional for public onboarding)
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Basic Information
    name: {
      type: String,
      required: [true, 'Startup name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    shortDesc: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    domain: {
      type: String,
      required: [true, 'Business domain is required'],
      enum: {
        values: [
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
        message: '{VALUE} is not a valid domain',
      },
    },

    stage: {
      type: String,
      required: [true, 'Startup stage is required'],
      enum: {
        values: ['Idea', 'MVP', 'Early-Stage', 'Growth', 'Scale-up'],
        message: '{VALUE} is not a valid stage',
      },
      default: 'Idea',
    },

    // Founders Information
    founders: {
      type: [{
        name: {
          type: String,
          required: [true, 'Founder name is required'],
          trim: true,
        },
        email: {
          type: String,
          required: [true, 'Founder email is required'],
          lowercase: true,
          trim: true,
          match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        role: {
          type: String,
          default: 'Co-Founder',
          trim: true,
        },
        linkedin: {
          type: String,
          trim: true,
        },
      }],
      validate: {
        validator: function (founders) {
          return founders && founders.length >= 1;
        },
        message: 'At least one founder is required',
      },
    },

    // Contact Information
    contact: {
      email: {
        type: String,
        required: [true, 'Contact email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[\d\s\-\+\(\)]+$/, 'Please provide a valid phone number'],
      },
      address: {
        type: String,
        trim: true,
      },
    },

    website: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/,
        'Please provide a valid URL',
      ],
    },

    // Pitch Deck Upload URL
    pitchDeckUrl: {
      type: String,
      trim: true,
    },

    // Logo URL
    logoUrl: {
      type: String,
      trim: true,
    },

    // Key Performance Indicators
    kpis: {
      revenue: {
        type: Number,
        default: 0,
        min: [0, 'Revenue cannot be negative'],
      },
      users: {
        type: Number,
        default: 0,
        min: [0, 'Users cannot be negative'],
      },
      growth: {
        type: Number,
        default: 0, // Percentage
      },
      funding: {
        type: Number,
        default: 0,
        min: [0, 'Funding cannot be negative'],
      },
      monthlyBurnRate: {
        type: Number,
        default: 0,
        min: [0, 'Burn rate cannot be negative'],
      },
      runway: {
        type: Number,
        default: 0, // Months
        min: [0, 'Runway cannot be negative'],
      },
    },

    // Assigned mentors
    mentors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
    }],

    // Application status
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected', 'Active', 'Graduated', 'Inactive'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Pending',
    },

    // Status change history
    statusHistory: [{
      status: String,
      changedAt: {
        type: Date,
        default: Date.now,
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
    }],

    // Additional metadata
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],

    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },

    // Cohort/batch information
    cohort: {
      type: String,
      trim: true,
    },

    // Social links
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
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

// Text index for full-text search
startupSchema.index(
  {
    name: 'text',
    shortDesc: 'text',
    tags: 'text',
  },
  {
    weights: {
      name: 10,
      shortDesc: 5,
      tags: 2,
    },
    name: 'startup_text_search',
  }
);

// Compound index for filtering
startupSchema.index({ stage: 1, domain: 1 }, { name: 'stage_domain_idx' });
startupSchema.index({ status: 1, createdAt: -1 }, { name: 'status_date_idx' });
startupSchema.index({ founder: 1 }, { name: 'founder_idx' });
startupSchema.index({ mentors: 1 }, { name: 'mentors_idx' });
startupSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 }, name: 'name_unique_idx' }
);

// =============================================================================
// VIRTUALS
// =============================================================================

// Virtual for founder count
startupSchema.virtual('founderCount').get(function () {
  return this.founders ? this.founders.length : 0;
});

// Virtual for mentor count
startupSchema.virtual('mentorCount').get(function () {
  return this.mentors ? this.mentors.length : 0;
});

// Virtual for progress score
startupSchema.virtual('progressScore').get(function () {
  return this.calculateProgressScore();
});

// =============================================================================
// HOOKS
// =============================================================================

// Pre-save hook: Normalize and validate fields
startupSchema.pre('save', function (next) {
  try {
    // Normalize name (trim and proper case)
    if (this.isModified('name') && this.name) {
      this.name = this.name
        .trim()
        .split(' ')
        .map(word => {
          if (word.length === 0) return '';
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .filter(word => word.length > 0)
        .join(' ');
    }

    // Validate founders
    if (this.isModified('founders')) {
      if (!this.founders || this.founders.length === 0) {
        return next(new Error('At least one founder is required'));
      }

      // Validate each founder
      for (let i = 0; i < this.founders.length; i++) {
        const founder = this.founders[i];
        if (!founder.name || founder.name.trim() === '') {
          return next(new Error(`Founder ${i + 1}: Name is required`));
        }
        if (!founder.email || !/^\S+@\S+\.\S+$/.test(founder.email)) {
          return next(new Error(`Founder ${i + 1}: Valid email is required`));
        }
      }
    }

    // Track status changes
    if (this.isModified('status') && !this.isNew) {
      this.statusHistory.push({
        status: this.status,
        changedAt: new Date(),
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Post-save hook: Create welcome notification for new startups
startupSchema.post('save', async function (doc, next) {
  // Skip in test environment or if notification fails
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  try {
    // Only for new documents with a founder
    if (!doc.founder) {
      return next();
    }

    // Safe model access
    let Notification;
    try {
      Notification = mongoose.model('Notification');
    } catch (e) {
      // Model not registered
      return next();
    }

    // Check if this is a status change to 'Approved'
    const statusHistory = doc.statusHistory || [];
    const lastStatusChange = statusHistory[statusHistory.length - 1];

    if (lastStatusChange && lastStatusChange.status === 'Approved') {
      await Notification.create({
        recipient: doc.founder,
        type: 'startup_status_changed',
        title: 'Startup Approved! 🎉',
        message: `Congratulations! "${doc.name}" has been approved for the incubator program.`,
        relatedModel: 'Startup',
        relatedId: doc._id,
        priority: 'high',
      });
    }
  } catch (error) {
    console.error('Error in startup post-save hook:', error.message);
    // Don't fail the save operation
  }

  next();
});

// Pre-remove hook: Clean up related data
startupSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const startupId = this._id;

    // Delete related mentorship requests
    try {
      await mongoose.model('MentorshipRequest').deleteMany({ startup: startupId });
    } catch (e) {
      // Model may not exist
    }

    // Delete related notifications
    try {
      await mongoose.model('Notification').deleteMany({ relatedId: startupId });
    } catch (e) {
      // Model may not exist
    }

    next();
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Check if startup is eligible for funding
 * @returns {boolean}
 */
startupSchema.methods.isEligibleForFunding = function () {
  return (
    this.status === 'Active' &&
    ['MVP', 'Early-Stage', 'Growth', 'Scale-up'].includes(this.stage) &&
    this.kpis.revenue > 0
  );
};

/**
 * Calculate progress score (0-100)
 * @returns {number}
 */
startupSchema.methods.calculateProgressScore = function () {
  let score = 0;

  // KPIs weight (40%)
  const kpis = this.kpis || {};
  if (kpis.revenue > 0) score += 10;
  if (kpis.users > 100) score += 10;
  if (kpis.growth > 0) score += 10;
  if (kpis.funding > 0) score += 10;

  // Mentors (20%)
  const mentors = this.mentors || [];
  const mentorScore = Math.min(mentors.length * 5, 20);
  score += mentorScore;

  // Status (20%)
  const statusScores = {
    Pending: 5,
    Approved: 10,
    Active: 15,
    Graduated: 20,
    Rejected: 0,
    Inactive: 0,
  };
  score += statusScores[this.status] || 0;

  // Stage (20%)
  const stageScores = {
    Idea: 5,
    MVP: 10,
    'Early-Stage': 12,
    Growth: 16,
    'Scale-up': 20,
  };
  score += stageScores[this.stage] || 0;

  return Math.min(score, 100);
};

/**
 * Update status with history tracking
 * @param {string} newStatus - New status
 * @param {ObjectId} changedBy - User who made the change
 * @param {string} reason - Reason for change
 */
startupSchema.methods.updateStatus = async function (newStatus, changedBy, reason = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy,
    reason,
  });
  await this.save();
};

/**
 * Add a mentor to the startup
 * @param {ObjectId} mentorId - Mentor to add
 */
startupSchema.methods.addMentor = async function (mentorId) {
  if (!this.mentors.includes(mentorId)) {
    this.mentors.push(mentorId);
    await this.save();
  }
};

/**
 * Remove a mentor from the startup
 * @param {ObjectId} mentorId - Mentor to remove
 */
startupSchema.methods.removeMentor = async function (mentorId) {
  this.mentors = this.mentors.filter(m => m.toString() !== mentorId.toString());
  await this.save();
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Get startups needing attention (inactive for 30+ days)
 * @returns {Promise<Startup[]>}
 */
startupSchema.statics.getNeedingAttention = async function () {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  return this.find({
    status: 'Active',
    updatedAt: { $lt: oneMonthAgo },
    mentors: { $size: 0 },
  })
    .populate('founder', 'name email')
    .limit(10);
};

/**
 * Get graduation candidates
 * @returns {Promise<Startup[]>}
 */
startupSchema.statics.getGraduationCandidates = async function () {
  return this.find({
    status: 'Active',
    stage: { $in: ['Growth', 'Scale-up'] },
    'kpis.funding': { $gte: 1000000 },
    'kpis.revenue': { $gte: 500000 },
  }).populate('founder', 'name email');
};

/**
 * Get startups by domain with stats
 * @param {string} domain - Domain to filter
 * @returns {Promise<Object>}
 */
startupSchema.statics.getByDomainWithStats = async function (domain) {
  const startups = await this.find({ domain, status: { $in: ['Active', 'Approved'] } });

  return {
    domain,
    count: startups.length,
    totalFunding: startups.reduce((sum, s) => sum + (s.kpis.funding || 0), 0),
    avgRevenue: startups.length > 0
      ? startups.reduce((sum, s) => sum + (s.kpis.revenue || 0), 0) / startups.length
      : 0,
    startups,
  };
};

module.exports = mongoose.model('Startup', startupSchema);
