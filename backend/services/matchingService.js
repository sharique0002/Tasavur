/**
 * Mentor Matching Service
 * Implements score-based matching algorithm with optional AI enhancement
 */

// =============================================================================
// SCORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate skill match score
 * @param {Array} requestSkills - Skills requested
 * @param {Array} mentorSkills - Mentor's skills/expertise
 * @returns {Number} Score 0-100
 */
const calculateSkillMatch = (requestSkills, mentorSkills) => {
  // Return neutral score if no specific skills requested
  if (!requestSkills || requestSkills.length === 0) return 50;
  if (!mentorSkills || mentorSkills.length === 0) return 0;

  // Normalize skills for comparison
  const requestSet = new Set(requestSkills.map(s => s.toLowerCase().trim()));
  const mentorSet = new Set(mentorSkills.map(s => s.toLowerCase().trim()));

  // Count exact matches
  let exactMatches = 0;
  let partialMatches = 0;

  requestSet.forEach(requestSkill => {
    if (mentorSet.has(requestSkill)) {
      exactMatches++;
    } else {
      // Check for partial matches (substring)
      for (const mentorSkill of mentorSet) {
        if (mentorSkill.includes(requestSkill) || requestSkill.includes(mentorSkill)) {
          partialMatches++;
          break;
        }
      }
    }
  });

  // Weighted score: exact matches worth more than partial
  const score = ((exactMatches * 100) + (partialMatches * 50)) / requestSkills.length;
  return Math.min(Math.round(score), 100);
};

/**
 * Calculate domain match score
 * @param {Array} requestDomains - Domains requested
 * @param {Array} mentorDomains - Mentor's domains
 * @returns {Number} Score 0-100
 */
const calculateDomainMatch = (requestDomains, mentorDomains) => {
  if (!requestDomains || requestDomains.length === 0) return 50;
  if (!mentorDomains || mentorDomains.length === 0) return 0;

  const overlap = requestDomains.filter(d => mentorDomains.includes(d)).length;
  return Math.round((overlap / requestDomains.length) * 100);
};

/**
 * Calculate availability score
 * @param {Array} preferredTimes - Requested time slots
 * @param {String} mentorAvailability - Mentor availability status
 * @returns {Number} Score 0-100
 */
const calculateAvailabilityScore = (preferredTimes, mentorAvailability) => {
  // Base score on availability status
  const statusScores = {
    'Available': 100,
    'Busy': 50,
    'Unavailable': 0,
  };

  const baseScore = statusScores[mentorAvailability] ?? 75;

  // Could be enhanced with actual time slot matching
  // For now, return base score
  return baseScore;
};

/**
 * Calculate rating score with experience bonus
 * @param {Number} mentorRating - Mentor's rating (0-5)
 * @param {Number} sessionsCompleted - Number of sessions completed
 * @returns {Number} Score 0-100
 */
const calculateRatingScore = (mentorRating, sessionsCompleted) => {
  // Rating component (0-80 points)
  const ratingScore = ((mentorRating || 0) / 5) * 80;

  // Experience bonus (0-20 points)
  // 1 point per session, max 20
  const experienceBonus = Math.min((sessionsCompleted || 0), 20);

  return Math.min(Math.round(ratingScore + experienceBonus), 100);
};

/**
 * Calculate capacity score (favors mentors with available slots)
 * @param {Number} currentMentees - Current number of mentees
 * @param {Number} maxMentees - Maximum capacity
 * @returns {Number} Score 0-100
 */
const calculateCapacityScore = (currentMentees, maxMentees) => {
  if (!maxMentees || maxMentees <= 0) return 0;

  const currentCount = currentMentees || 0;
  if (currentCount >= maxMentees) return 0;

  const availableSlots = maxMentees - currentCount;
  const capacityRatio = availableSlots / maxMentees;

  return Math.round(capacityRatio * 100);
};

// =============================================================================
// OPTIONAL AI INTEGRATION
// =============================================================================

/**
 * Calculate semantic similarity using OpenAI embeddings (optional)
 * @param {String} requestDescription - Request description
 * @param {String} mentorBio - Mentor's bio
 * @returns {Number|null} Score 0-100 or null if unavailable
 */
const calculateSemanticScore = async (requestDescription, mentorBio) => {
  // Skip if OpenAI is not configured
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  // Skip if missing data
  if (!requestDescription || !mentorBio) {
    return null;
  }

  try {
    // Dynamic import for axios (may not be installed)
    let axios;
    try {
      axios = require('axios');
    } catch (e) {
      console.log('Axios not available for AI matching');
      return null;
    }

    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: [requestDescription, mentorBio],
        model: 'text-embedding-3-small',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      }
    );

    const embeddings = response.data.data;
    if (!embeddings || embeddings.length < 2) {
      return null;
    }

    const embedding1 = embeddings[0].embedding;
    const embedding2 = embeddings[1].embedding;

    // Calculate cosine similarity
    const similarity = cosineSimilarity(embedding1, embedding2);

    // Convert to 0-100 scale (cosine similarity is -1 to 1, but usually 0 to 1 for embeddings)
    return Math.round(similarity * 100);

  } catch (error) {
    console.error('Semantic score calculation error:', error.message);
    return null;
  }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vec1 - First vector
 * @param {Array} vec2 - Second vector
 * @returns {Number} Similarity score (-1 to 1)
 */
const cosineSimilarity = (vec1, vec2) => {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  return dotProduct / (mag1 * mag2);
};

// =============================================================================
// MAIN MATCHING ALGORITHM
// =============================================================================

/**
 * Main matching algorithm
 * @param {Object} request - Mentorship request object
 * @param {Array} mentors - Available mentors
 * @param {Object} options - Matching options
 * @returns {Array} Sorted array of mentor matches with scores
 */
const matchMentors = async (request, mentors, options = {}) => {
  const {
    includeAI = true,
    minScore = 0,
    maxResults = 10,
  } = options;

  const matches = [];

  for (const mentor of mentors) {
    // Skip if mentor is at capacity
    const menteesCount = mentor.currentMentees?.length || 0;
    if (menteesCount >= (mentor.maxMentees || 5)) {
      continue;
    }

    // Skip if mentor is not active
    if (!mentor.isActive) {
      continue;
    }

    // Skip if explicitly unavailable
    if (mentor.availability === 'Unavailable') {
      continue;
    }

    // Calculate individual scores
    const skillScore = calculateSkillMatch(request.skills, mentor.expertise);
    const domainScore = calculateDomainMatch(request.domains, mentor.domains);
    const availabilityScore = calculateAvailabilityScore(
      request.preferredTimes,
      mentor.availability
    );
    const ratingScore = calculateRatingScore(
      mentor.rating,
      mentor.sessionsCompleted
    );
    const capacityScore = calculateCapacityScore(
      mentor.currentMentees?.length,
      mentor.maxMentees
    );

    // Calculate semantic score (optional, may be null)
    let semanticScore = null;
    if (includeAI) {
      semanticScore = await calculateSemanticScore(
        request.description,
        mentor.bio || ''
      );
    }

    // Weight configuration
    const weights = {
      skill: 0.30,      // 30%
      domain: 0.20,     // 20%
      availability: 0.15, // 15%
      rating: 0.15,     // 15%
      capacity: 0.10,   // 10%
      semantic: 0.10,   // 10% (if available)
    };

    // Calculate base score (without semantic)
    let finalScore =
      skillScore * weights.skill +
      domainScore * weights.domain +
      availabilityScore * weights.availability +
      ratingScore * weights.rating +
      capacityScore * weights.capacity;

    // Add semantic score if available
    if (semanticScore !== null) {
      finalScore += semanticScore * weights.semantic;
    } else {
      // Redistribute semantic weight proportionally to other scores
      const redistWeight = weights.semantic / (1 - weights.semantic);
      finalScore = finalScore * (1 + redistWeight);
    }

    // Round to 2 decimal places
    finalScore = Math.round(finalScore * 100) / 100;

    // Skip if below minimum score
    if (finalScore < minScore) {
      continue;
    }

    matches.push({
      mentor: mentor._id,
      mentorData: {
        _id: mentor._id,
        user: mentor.user,
        name: mentor.name,
        expertise: mentor.expertise,
        domains: mentor.domains,
        bio: mentor.bio,
        rating: mentor.rating,
        sessionsCompleted: mentor.sessionsCompleted,
        availability: mentor.availability,
        avatar: mentor.avatar,
        company: mentor.company,
      },
      score: finalScore,
      skillMatchScore: skillScore,
      domainMatchScore: domainScore,
      availabilityScore: availabilityScore,
      ratingScore: ratingScore,
      capacityScore: capacityScore,
      semanticScore: semanticScore,
      status: 'Suggested',
    });
  }

  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);

  // Limit results
  return matches.slice(0, maxResults);
};

// =============================================================================
// AI RECOMMENDATION SUMMARY
// =============================================================================

/**
 * Get AI-powered mentor recommendation summary
 * @param {Object} request - Mentorship request
 * @param {Array} topMatches - Top mentor matches
 * @returns {String|null} AI-generated summary or null
 */
const getAIRecommendationSummary = async (request, topMatches) => {
  if (!process.env.OPENAI_API_KEY || !topMatches || topMatches.length === 0) {
    return null;
  }

  try {
    let axios;
    try {
      axios = require('axios');
    } catch (e) {
      return null;
    }

    const mentorSummaries = topMatches.slice(0, 3).map((match, index) => {
      const mentor = match.mentorData;
      return `${index + 1}. ${mentor.name || 'Mentor'} - Expertise: ${mentor.expertise?.join(', ') || 'N/A'} - Score: ${match.score}%`;
    });

    const prompt = `Based on the following mentorship request and matched mentors, provide a brief recommendation (2-3 sentences):

Request Topic: ${request.topic || 'General'}
Description: ${request.description || 'N/A'}
Skills Needed: ${request.skills?.join(', ') || 'N/A'}

Top Matched Mentors:
${mentorSummaries.join('\n')}

Provide a concise recommendation explaining why these mentors are good matches and any considerations for selection.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides mentor matching recommendations for startup founders. Be concise and actionable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return response.data.choices[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error('AI recommendation summary error:', error.message);
    return null;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  matchMentors,
  calculateSkillMatch,
  calculateDomainMatch,
  calculateAvailabilityScore,
  calculateRatingScore,
  calculateCapacityScore,
  calculateSemanticScore,
  cosineSimilarity,
  getAIRecommendationSummary,
};
