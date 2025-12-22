const mongoose = require('mongoose');

/**
 * FundingApplication Model
 * Manages funding applications from startups
 * Tracks investment rounds, amounts, and application status
 */
const fundingApplicationSchema = new mongoose.Schema(
  {
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: [true, 'Startup reference is required'],
    },

    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant reference is required'],
    },

    roundType: {
      type: String,
      required: [true, 'Round type is required'],
      enum: {
        values: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Bridge', 'Grant', 'Other'],
        message: '{VALUE} is not a valid round type',
      },
    },

    amountRequested: {
      type: Number,
      required: [true, 'Amount requested is required'],
      min: [0, 'Amount must be positive'],
    },

    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'Other'],
    },

    amountApproved: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Withdrawn'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Draft',
    },

    // Application details
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      trim: true,
      maxlength: [2000, 'Purpose cannot exceed 2000 characters'],
    },

    // Use of funds breakdown
    useOfFunds: {
      breakdown: [{
        category: {
          type: String,
          required: true,
          enum: ['Product Development', 'Marketing', 'Operations', 'Hiring', 'Infrastructure', 'R&D', 'Other'],
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        description: {
          type: String,
          trim: true,
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100,
        },
      }],
      totalAllocated: {
        type: Number,
        default: 0,
      },
    },

    // Current metrics
    currentMetrics: {
      revenue: { type: Number, default: 0, min: 0 },
      monthlyBurnRate: { type: Number, default: 0, min: 0 },
      runway: { type: Number, default: 0, min: 0 }, // months
      teamSize: { type: Number, default: 0, min: 0 },
      customers: { type: Number, default: 0, min: 0 },
      mrr: { type: Number, default: 0, min: 0 }, // Monthly Recurring Revenue
      arr: { type: Number, default: 0, min: 0 }, // Annual Recurring Revenue
    },

    // Growth projections
    projections: {
      sixMonths: {
        revenue: Number,
        users: Number,
        marketShare: Number,
      },
      twelveMonths: {
        revenue: Number,
        users: Number,
        marketShare: Number,
      },
      twentyFourMonths: {
        revenue: Number,
        users: Number,
        marketShare: Number,
      },
    },

    // Supporting documents
    documents: [{
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['Pitch Deck', 'Financial Statements', 'Cap Table', 'Business Plan', 'Legal Documents', 'Other'],
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      fileSize: Number,
    }],

    // Review process
    reviewers: [{
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      decision: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Needs More Info'],
        default: 'Pending',
      },
      comments: {
        type: String,
        maxlength: 2000,
      },
      reviewedAt: Date,
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
    }],

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    adminNotes: {
      type: String,
      maxlength: 2000,
    },

    rejectionReason: {
      type: String,
      maxlength: 1000,
    },

    // Timestamps for status changes
    submittedAt: Date,
    reviewStartedAt: Date,
    decisionAt: Date,

    // Terms (if approved)
    terms: {
      equityPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      valuation: {
        type: Number,
        min: 0,
      },
      investmentType: {
        type: String,
        enum: ['Equity', 'Convertible Note', 'SAFE', 'Grant', 'Debt', 'Other'],
      },
      conditions: [{
        type: String,
        trim: true,
      }],
      vestingSchedule: {
        type: String,
        trim: true,
      },
    },

    // Priority level
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
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

fundingApplicationSchema.index(
  { startup: 1, status: 1, createdAt: -1 },
  { name: 'startup_status_date_idx' }
);

fundingApplicationSchema.index(
  { status: 1, roundType: 1, createdAt: -1 },
  { name: 'status_round_date_idx' }
);

fundingApplicationSchema.index(
  { applicant: 1, createdAt: -1 },
  { name: 'applicant_date_idx' }
);

fundingApplicationSchema.index(
  { assignedTo: 1, status: 1 },
  { name: 'assigned_status_idx' }
);

fundingApplicationSchema.index(
  { 'reviewers.reviewer': 1 },
  { name: 'reviewers_idx' }
);

// =============================================================================
// VIRTUALS
// =============================================================================

// Review progress (percentage of reviewers who have reviewed)
fundingApplicationSchema.virtual('reviewProgress').get(function () {
  if (!this.reviewers || this.reviewers.length === 0) return 0;
  const reviewed = this.reviewers.filter(r => r.decision !== 'Pending').length;
  return Math.round((reviewed / this.reviewers.length) * 100);
});

// Average review score
fundingApplicationSchema.virtual('averageScore').get(function () {
  if (!this.reviewers || this.reviewers.length === 0) return null;
  const scores = this.reviewers.filter(r => r.score).map(r => r.score);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
});

// Days since submission
fundingApplicationSchema.virtual('daysSinceSubmission').get(function () {
  if (!this.submittedAt) return null;
  return Math.floor((new Date() - this.submittedAt) / (1000 * 60 * 60 * 24));
});

// =============================================================================
// HOOKS
// =============================================================================

// Validate and calculate totals before saving
fundingApplicationSchema.pre('save', function (next) {
  // Calculate total allocated funds
  if (this.useOfFunds && this.useOfFunds.breakdown) {
    this.useOfFunds.totalAllocated = this.useOfFunds.breakdown.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    // Calculate percentages
    if (this.amountRequested > 0) {
      this.useOfFunds.breakdown.forEach(item => {
        item.percentage = Math.round((item.amount / this.amountRequested) * 100);
      });
    }

    // Validate total doesn't exceed requested
    if (this.useOfFunds.totalAllocated > this.amountRequested) {
      return next(new Error('Total allocated funds cannot exceed requested amount'));
    }
  }

  // Set timestamps based on status changes
  if (this.isModified('status')) {
    const now = new Date();

    switch (this.status) {
      case 'Submitted':
        if (!this.submittedAt) this.submittedAt = now;
        break;
      case 'Under Review':
        if (!this.reviewStartedAt) this.reviewStartedAt = now;
        break;
      case 'Approved':
      case 'Rejected':
        if (!this.decisionAt) this.decisionAt = now;
        break;
    }
  }

  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Check if application can be edited
 * @returns {boolean}
 */
fundingApplicationSchema.methods.isEditable = function () {
  return ['Draft', 'Submitted'].includes(this.status);
};

/**
 * Check if application can be withdrawn
 * @returns {boolean}
 */
fundingApplicationSchema.methods.canWithdraw = function () {
  return ['Submitted', 'Under Review'].includes(this.status);
};

/**
 * Withdraw application
 * @param {string} reason - Withdrawal reason
 */
fundingApplicationSchema.methods.withdraw = async function (reason) {
  if (!this.canWithdraw()) {
    throw new Error('Application cannot be withdrawn in current status');
  }

  this.status = 'Withdrawn';
  this.rejectionReason = reason;
  await this.save();

  return this;
};

/**
 * Submit application
 */
fundingApplicationSchema.methods.submit = async function () {
  if (this.status !== 'Draft') {
    throw new Error('Only draft applications can be submitted');
  }

  this.status = 'Submitted';
  this.submittedAt = new Date();
  await this.save();

  return this;
};

/**
 * Add a reviewer
 * @param {ObjectId} reviewerId - User ID of reviewer
 */
fundingApplicationSchema.methods.addReviewer = async function (reviewerId) {
  const exists = this.reviewers.some(
    r => r.reviewer.toString() === reviewerId.toString()
  );

  if (!exists) {
    this.reviewers.push({
      reviewer: reviewerId,
      decision: 'Pending',
    });
    await this.save();
  }

  return this;
};

/**
 * Submit review
 * @param {ObjectId} reviewerId - Reviewer's user ID
 * @param {Object} reviewData - Review details
 */
fundingApplicationSchema.methods.submitReview = async function (reviewerId, reviewData) {
  const reviewer = this.reviewers.find(
    r => r.reviewer.toString() === reviewerId.toString()
  );

  if (!reviewer) {
    throw new Error('Reviewer not assigned to this application');
  }

  reviewer.decision = reviewData.decision;
  reviewer.comments = reviewData.comments;
  reviewer.score = reviewData.score;
  reviewer.reviewedAt = new Date();

  await this.save();
  return reviewer;
};

/**
 * Calculate funding efficiency score
 * @returns {number}
 */
fundingApplicationSchema.methods.calculateEfficiencyScore = function () {
  if (!this.currentMetrics.revenue || !this.amountRequested) {
    return 0;
  }

  const revenueToFundingRatio = this.currentMetrics.revenue / this.amountRequested;
  const runwayScore = Math.min((this.currentMetrics.runway || 0) / 12, 1);
  const teamScore = Math.min((this.currentMetrics.teamSize || 0) / 10, 1);

  const score = (revenueToFundingRatio * 0.5 + runwayScore * 0.3 + teamScore * 0.2) * 100;
  return Math.min(Math.round(score), 100);
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Get pending applications for review
 * @param {number} limit - Max results
 * @returns {Promise<FundingApplication[]>}
 */
fundingApplicationSchema.statics.getPendingReview = async function (limit = 10) {
  return this.find({ status: 'Under Review' })
    .populate('startup', 'name domain stage')
    .populate('applicant', 'name email')
    .sort({ priority: -1, submittedAt: 1 })
    .limit(limit);
};

/**
 * Get funding statistics
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>}
 */
fundingApplicationSchema.statics.getStatistics = async function (filters = {}) {
  const matchStage = { ...filters };

  const [statusStats, roundStats, totalApproved] = await Promise.all([
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRequested: { $sum: '$amountRequested' },
          totalApproved: { $sum: '$amountApproved' },
          avgAmount: { $avg: '$amountRequested' },
        },
      },
    ]),
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$roundType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amountRequested' },
        },
      },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amountApproved' } } },
    ]),
  ]);

  return {
    statusStats,
    roundStats,
    totalApprovedFunding: totalApproved[0]?.total || 0,
  };
};

/**
 * Get applications needing attention
 * @returns {Promise<FundingApplication[]>}
 */
fundingApplicationSchema.statics.getNeedingAttention = async function () {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return this.find({
    status: 'Under Review',
    reviewStartedAt: { $lt: sevenDaysAgo },
  })
    .populate('startup', 'name')
    .populate('applicant', 'name email')
    .sort({ priority: -1, reviewStartedAt: 1 });
};

/**
 * Get applications for a startup
 * @param {ObjectId} startupId - Startup ID
 * @returns {Promise<FundingApplication[]>}
 */
fundingApplicationSchema.statics.getForStartup = function (startupId) {
  return this.find({ startup: startupId })
    .sort({ createdAt: -1 })
    .populate('reviewers.reviewer', 'name');
};

module.exports = mongoose.model('FundingApplication', fundingApplicationSchema);
