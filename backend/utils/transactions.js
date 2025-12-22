const mongoose = require('mongoose');

/**
 * Transaction Utilities
 * Helper functions for MongoDB transactions
 * Ensures atomic operations across multiple documents
 */

/**
 * Execute a function within a MongoDB transaction
 * @param {Function} fn - Async function to execute within transaction
 * @returns {Promise} Result of the transaction
 */
async function withTransaction(fn) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Assign mentor to request and create session atomically
 * @param {String} requestId - Mentorship request ID
 * @param {String} mentorId - Mentor ID
 * @param {Object} sessionData - Session details
 * @returns {Promise<Object>} Updated request and created session
 */
async function assignMentorAndCreateSession(requestId, mentorId, sessionData) {
  return withTransaction(async (session) => {
    const MentorshipRequest = mongoose.model('MentorshipRequest');
    const Mentor = mongoose.model('Mentor');

    // Update mentorship request
    const request = await MentorshipRequest.findByIdAndUpdate(
      requestId,
      {
        $set: {
          selectedMentor: mentorId,
          status: 'Scheduled'
        },
        $push: {
          sessions: {
            mentor: mentorId,
            scheduledAt: sessionData.scheduledAt,
            duration: sessionData.duration || 60,
            meetingLink: sessionData.meetingLink,
            status: 'Scheduled'
          }
        }
      },
      { new: true, session }
    );

    if (!request) {
      throw new Error('Mentorship request not found');
    }

    // Update mentor availability (decrement available slots)
    const mentor = await Mentor.findByIdAndUpdate(
      mentorId,
      {
        $inc: { 'availability.slotsAvailable': -1 }
      },
      { new: true, session }
    );

    if (!mentor) {
      throw new Error('Mentor not found');
    }

    return { request, mentor };
  });
}

/**
 * Update startup status and create notification atomically
 * @param {String} startupId - Startup ID
 * @param {String} newStatus - New status
 * @param {Object} notificationData - Notification details
 * @returns {Promise<Object>} Updated startup and notification
 */
async function updateStartupStatusWithNotification(startupId, newStatus, notificationData) {
  return withTransaction(async (session) => {
    const Startup = mongoose.model('Startup');
    const Notification = mongoose.model('Notification');

    // Update startup status
    const startup = await Startup.findByIdAndUpdate(
      startupId,
      { $set: { status: newStatus } },
      { new: true, session }
    );

    if (!startup) {
      throw new Error('Startup not found');
    }

    // Create notification
    const notification = await Notification.create(
      [
        {
          recipient: startup.founder,
          type: notificationData.type || 'startup_status_changed',
          title: notificationData.title,
          message: notificationData.message,
          relatedModel: 'Startup',
          relatedId: startupId,
          priority: notificationData.priority || 'medium'
        }
      ],
      { session }
    );

    return { startup, notification: notification[0] };
  });
}

/**
 * Submit funding application and update startup atomically
 * @param {Object} applicationData - Funding application data
 * @param {String} startupId - Startup ID
 * @returns {Promise<Object>} Created application and updated startup
 */
async function submitFundingApplication(applicationData, startupId) {
  return withTransaction(async (session) => {
    const FundingApplication = mongoose.model('FundingApplication');
    const Startup = mongoose.model('Startup');

    // Create funding application
    const application = await FundingApplication.create(
      [
        {
          ...applicationData,
          startup: startupId,
          status: 'Submitted',
          submittedAt: new Date()
        }
      ],
      { session }
    );

    // Update startup funding status
    const startup = await Startup.findByIdAndUpdate(
      startupId,
      {
        $inc: { 'kpis.funding': applicationData.amountRequested }
      },
      { new: true, session }
    );

    if (!startup) {
      throw new Error('Startup not found');
    }

    return { application: application[0], startup };
  });
}

/**
 * Complete mentorship session with feedback from both parties atomically
 * @param {String} requestId - Mentorship request ID
 * @param {String} sessionId - Session ID
 * @param {Object} founderFeedback - Feedback from founder
 * @param {Object} mentorFeedback - Feedback from mentor
 * @returns {Promise<Object>} Updated request and mentor
 */
async function completeSessionWithFeedback(requestId, sessionId, founderFeedback, mentorFeedback) {
  return withTransaction(async (session) => {
    const MentorshipRequest = mongoose.model('MentorshipRequest');
    const Mentor = mongoose.model('Mentor');

    // Find request and session
    const request = await MentorshipRequest.findById(requestId).session(session);
    if (!request) {
      throw new Error('Mentorship request not found');
    }

    const sessionDoc = request.sessions.id(sessionId);
    if (!sessionDoc) {
      throw new Error('Session not found');
    }

    // Update session with feedback
    sessionDoc.status = 'Completed';
    sessionDoc.founderFeedback = {
      ...founderFeedback,
      submittedAt: new Date()
    };
    sessionDoc.mentorFeedback = {
      ...mentorFeedback,
      submittedAt: new Date()
    };

    await request.save({ session });

    // Update mentor's average rating
    const mentorId = sessionDoc.mentor;
    const mentor = await Mentor.findById(mentorId).session(session);
    
    if (mentor) {
      const allFeedback = await MentorshipRequest.aggregate([
        { $unwind: '$sessions' },
        { $match: { 'sessions.mentor': mentorId, 'sessions.founderFeedback.rating': { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$sessions.founderFeedback.rating' } } }
      ]).session(session);

      if (allFeedback.length > 0) {
        mentor.rating = allFeedback[0].avgRating;
        await mentor.save({ session });
      }
    }

    return { request, mentor };
  });
}

/**
 * Bulk update startup statuses with notifications
 * @param {Array} updates - Array of {startupId, newStatus}
 * @returns {Promise<Array>} Array of updated startups
 */
async function bulkUpdateStartupsWithNotifications(updates) {
  return withTransaction(async (session) => {
    const Startup = mongoose.model('Startup');
    const Notification = mongoose.model('Notification');

    const updatedStartups = [];
    const notifications = [];

    for (const { startupId, newStatus } of updates) {
      const startup = await Startup.findByIdAndUpdate(
        startupId,
        { $set: { status: newStatus } },
        { new: true, session }
      );

      if (startup) {
        updatedStartups.push(startup);

        notifications.push({
          recipient: startup.founder,
          type: 'startup_status_changed',
          title: 'Startup Status Updated',
          message: `Your startup status has been changed to ${newStatus}.`,
          relatedModel: 'Startup',
          relatedId: startupId,
          priority: 'medium'
        });
      }
    }

    // Create all notifications in bulk
    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { session });
    }

    return updatedStartups;
  });
}

module.exports = {
  withTransaction,
  assignMentorAndCreateSession,
  updateStartupStatusWithNotification,
  submitFundingApplication,
  completeSessionWithFeedback,
  bulkUpdateStartupsWithNotifications
};
