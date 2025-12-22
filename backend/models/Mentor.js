const mongoose = require('mongoose');

/**
 * Mentor Model
 * Represents mentors available in the incubator platform
 */
const mentorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    name: {
      type: String,
      required: [true, 'Mentor name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    expertise: {
      type: [{
        type: String,
        trim: true,
      }],
      validate: {
        validator: function (arr) {
          return arr && arr.length >= 1;
        },
        message: 'At least one area of expertise is required',
      },
    },

    domains: [{
      type: String,
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
    }],

    bio: {
      type: String,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      trim: true,
    },

    avatar: {
      type: String,
      default: 'https://via.placeholder.com/150',
    },

    experience: {
      type: Number, // Years of experience
      default: 0,
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years'],
    },

    company: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },

    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    linkedin: {
      type: String,
      trim: true,
    },

    twitter: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    availability: {
      type: String,
      enum: {
        values: ['Available', 'Busy', 'Unavailable'],
        message: '{VALUE} is not a valid availability status',
      },
      default: 'Available',
    },

    // Preferred meeting times
    preferredTimes: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
      startTime: String, // e.g., "09:00"
      endTime: String,   // e.g., "17:00"
    }],

    timezone: {
      type: String,
      default: 'UTC',
    },

    maxMentees: {
      type: Number,
      default: 5,
      min: [1, 'Max mentees must be at least 1'],
      max: [20, 'Max mentees cannot exceed 20'],
    },

    currentMentees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
    }],

    // Rating (calculated from feedback)
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Total ratings received
    totalRatings: {
      type: Number,
      default: 0,
    },

    sessionsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Languages spoken
    languages: [{
      type: String,
      trim: true,
    }],

    // Hourly rate (if applicable)
    hourlyRate: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },

    // Featured mentor flag
    featured: {
      type: Boolean,
      default: false,
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

mentorSchema.index({ domains: 1, availability: 1 }, { name: 'domains_availability_idx' });
mentorSchema.index({ expertise: 1 }, { name: 'expertise_idx' });
mentorSchema.index({ user: 1 }, { unique: true, name: 'user_unique_idx' });
mentorSchema.index({ rating: -1, sessionsCompleted: -1 }, { name: 'rating_sessions_idx' });
mentorSchema.index({ isActive: 1, availability: 1 }, { name: 'active_available_idx' });

// =============================================================================
// VIRTUALS
// =============================================================================

// Virtual for checking if mentor is at capacity
mentorSchema.virtual('isAtCapacity').get(function () {
  return this.currentMentees.length >= this.maxMentees;
});

// Virtual for available slots
mentorSchema.virtual('availableSlots').get(function () {
  return Math.max(0, this.maxMentees - this.currentMentees.length);
});

// Virtual for current mentee count
mentorSchema.virtual('menteeCount').get(function () {
  return this.currentMentees.length;
});

// =============================================================================
// HOOKS
// =============================================================================

// Update availability based on mentee count
mentorSchema.pre('save', function (next) {
  if (this.isModified('currentMentees')) {
    if (this.currentMentees.length >= this.maxMentees) {
      this.availability = 'Busy';
    } else if (this.availability === 'Busy' && this.currentMentees.length < this.maxMentees) {
      this.availability = 'Available';
    }
  }
  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Add a mentee to the mentor
 * @param {ObjectId} startupId - Startup to add
 * @returns {Promise<boolean>} Success status
 */
mentorSchema.methods.addMentee = async function (startupId) {
  if (this.isAtCapacity) {
    return false;
  }

  if (!this.currentMentees.includes(startupId)) {
    this.currentMentees.push(startupId);
    await this.save();
  }

  return true;
};

/**
 * Remove a mentee from the mentor
 * @param {ObjectId} startupId - Startup to remove
 */
mentorSchema.methods.removeMentee = async function (startupId) {
  this.currentMentees = this.currentMentees.filter(
    m => m.toString() !== startupId.toString()
  );
  await this.save();
};

/**
 * Update rating based on new feedback
 * @param {number} newRating - New rating value (1-5)
 */
mentorSchema.methods.updateRating = async function (newRating) {
  if (newRating < 1 || newRating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Calculate new average rating
  const currentTotal = this.rating * this.totalRatings;
  this.totalRatings += 1;
  this.rating = (currentTotal + newRating) / this.totalRatings;
  this.rating = Math.round(this.rating * 100) / 100; // Round to 2 decimal places

  await this.save();
};

/**
 * Increment sessions completed
 */
mentorSchema.methods.completeSession = async function () {
  this.sessionsCompleted += 1;
  await this.save();
};

/**
 * Check if mentor has expertise in a specific area
 * @param {string} skill - Skill to check
 * @returns {boolean}
 */
mentorSchema.methods.hasExpertise = function (skill) {
  return this.expertise.some(
    exp => exp.toLowerCase() === skill.toLowerCase()
  );
};

/**
 * Check if mentor covers a specific domain
 * @param {string} domain - Domain to check
 * @returns {boolean}
 */
mentorSchema.methods.coversDomain = function (domain) {
  return this.domains.includes(domain);
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Find available mentors by domain
 * @param {string} domain - Domain to filter by
 * @returns {Promise<Mentor[]>}
 */
mentorSchema.statics.findAvailableByDomain = function (domain) {
  return this.find({
    isActive: true,
    availability: { $in: ['Available', 'Busy'] },
    domains: domain,
  })
    .where('currentMentees')
    .lt('maxMentees')
    .sort({ rating: -1 })
    .populate('user', 'name email avatar');
};

/**
 * Find available mentors by expertise
 * @param {string[]} skills - Skills to match
 * @returns {Promise<Mentor[]>}
 */
mentorSchema.statics.findByExpertise = function (skills) {
  return this.find({
    isActive: true,
    availability: { $ne: 'Unavailable' },
    expertise: { $in: skills },
  })
    .sort({ rating: -1 })
    .populate('user', 'name email avatar');
};

/**
 * Get top rated mentors
 * @param {number} limit - Number of mentors to return
 * @returns {Promise<Mentor[]>}
 */
mentorSchema.statics.getTopRated = function (limit = 10) {
  return this.find({
    isActive: true,
    sessionsCompleted: { $gte: 5 }, // At least 5 sessions for credibility
  })
    .sort({ rating: -1, sessionsCompleted: -1 })
    .limit(limit)
    .populate('user', 'name email avatar');
};

/**
 * Get featured mentors
 * @returns {Promise<Mentor[]>}
 */
mentorSchema.statics.getFeatured = function () {
  return this.find({
    isActive: true,
    featured: true,
  })
    .sort({ rating: -1 })
    .populate('user', 'name email avatar');
};

/**
 * Search mentors by text
 * @param {string} query - Search query
 * @returns {Promise<Mentor[]>}
 */
mentorSchema.statics.search = function (query) {
  const searchRegex = new RegExp(query, 'i');

  return this.find({
    isActive: true,
    $or: [
      { name: searchRegex },
      { bio: searchRegex },
      { expertise: searchRegex },
      { company: searchRegex },
    ],
  })
    .sort({ rating: -1 })
    .populate('user', 'name email avatar');
};

module.exports = mongoose.model('Mentor', mentorSchema);
