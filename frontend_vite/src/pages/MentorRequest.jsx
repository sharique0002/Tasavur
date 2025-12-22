import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * MentorRequest Page
 * Form to request mentorship and view matched mentors
 */
const MentorRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [startups, setStartups] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form

  const [formData, setFormData] = useState({
    startupId: searchParams.get('startup') || '',
    topic: '',
    description: '',
    domains: [],
    skills: [],
    urgency: 'Medium',
    preferredTimes: [],
  });

  const [skillInput, setSkillInput] = useState('');
  const [matchResults, setMatchResults] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to request mentorship');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user's startups
  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const response = await api.get('/startups', {
          params: { founder: user?._id },
        });
        setStartups(response.data.data);
      } catch (error) {
        console.error('Error fetching startups:', error);
      }
    };

    if (user?.role === 'founder') {
      fetchStartups();
    }
  }, [user]);

  // Fetch available mentors for preview
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await api.get('/mentorship/mentors');
        setMentors(response.data.data);
      } catch (error) {
        console.error('Error fetching mentors:', error);
      }
    };
    fetchMentors();
  }, []);

  const domains = [
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
  ];

  const urgencyLevels = ['Low', 'Medium', 'High', 'Critical'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDomainToggle = (domain) => {
    setFormData((prev) => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter((d) => d !== domain)
        : [...prev.domains, domain],
    }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.startupId) {
      toast.error('Please select a startup');
      return;
    }

    if (formData.skills.length === 0) {
      toast.error('Please add at least one skill');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/mentorship/requests', formData);

      toast.success('Mentorship request submitted! 🎉');
      
      // Store match results
      setMatchResults(response.data.data.request);
      setAiSummary(response.data.data.aiSummary);
      
      // Move to results step
      setStep(3);
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg);
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤝 Request Mentorship
          </h1>
          <p className="text-gray-600">
            Get matched with the perfect mentor for your startup journey
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      step > s ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-20 mt-2">
            <span className="text-sm text-gray-600">Details</span>
            <span className="text-sm text-gray-600">Skills</span>
            <span className="text-sm text-gray-600">Results</span>
          </div>
        </div>

        {/* Form */}
        {step < 3 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Details */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Basic Information
                  </h2>

                  {/* Startup Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Startup <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="startupId"
                      value={formData.startupId}
                      onChange={handleChange}
                      className="input"
                      required
                    >
                      <option value="">Choose a startup...</option>
                      {startups.map((startup) => (
                        <option key={startup._id} value={startup._id}>
                          {startup.name} - {startup.stage}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mentorship Topic <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Fundraising Strategy, Product-Market Fit"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detailed Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      rows="5"
                      value={formData.description}
                      onChange={handleChange}
                      className="input"
                      placeholder="Describe what you need help with, your current challenges, and what you hope to achieve..."
                      maxLength="1000"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.description.length}/1000
                    </p>
                  </div>

                  {/* Domains */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relevant Domains
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {domains.map((domain) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => handleDomainToggle(domain)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            formData.domains.includes(domain)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urgency Level
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleChange}
                      className="input"
                    >
                      {urgencyLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn btn-primary"
                    >
                      Next: Add Skills →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Skills & Preferences */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Skills & Expertise Needed
                  </h2>

                  {/* Skills Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add Skills <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        className="input"
                        placeholder="e.g., Marketing, Sales, Fundraising"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="btn btn-primary"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Press Enter or click Add to include a skill
                    </p>
                  </div>

                  {/* Skills List */}
                  {formData.skills.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Skills ({formData.skills.length})
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <div
                            key={skill}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center space-x-2"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-primary-900 hover:text-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Mentors Preview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      📊 {mentors.length} Mentors Available
                    </h3>
                    <p className="text-sm text-blue-700">
                      Our AI-powered matching engine will find the best mentors for your needs
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn btn-secondary"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || formData.skills.length === 0}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      {loading ? 'Matching...' : 'Find Mentors 🔍'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Step 3: Match Results */}
        {step === 3 && matchResults && (
          <div className="space-y-6">
            {/* AI Summary */}
            {aiSummary && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-bold text-purple-900 mb-2 flex items-center">
                  <span className="mr-2">🤖</span> AI Recommendation
                </h3>
                <p className="text-purple-800">{aiSummary}</p>
              </div>
            )}

            {/* Match Results */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ✨ Matched Mentors ({matchResults.matchedMentors?.length || 0})
              </h2>

              {matchResults.matchedMentors && matchResults.matchedMentors.length > 0 ? (
                <div className="space-y-4">
                  {matchResults.matchedMentors.map((match, index) => (
                    <MentorMatchCard
                      key={match.mentor._id}
                      match={match}
                      rank={index + 1}
                      requestId={matchResults._id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No mentors matched. Try adjusting your criteria.</p>
              )}
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate('/mentorship/my-requests')}
                className="btn btn-primary"
              >
                View My Requests
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * MentorMatchCard Component
 * Displays a matched mentor with score breakdown
 */
const MentorMatchCard = ({ match, rank, requestId }) => {
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(false);

  const handleSelectMentor = async () => {
    setSelecting(true);
    try {
      await api.put(`/mentorship/requests/${requestId}/select-mentor`, {
        mentorId: match.mentor._id,
      });
      toast.success('Mentor selected! Proceed to schedule a session.');
      navigate(`/mentorship/requests/${requestId}`);
    } catch (error) {
      toast.error('Error selecting mentor');
    } finally {
      setSelecting(false);
    }
  };

  const mentor = match.mentor;

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          {/* Rank Badge */}
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
              rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-600'
            }`}>
              #{rank}
            </div>
          </div>

          {/* Mentor Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <img
                src={mentor.avatar || 'https://via.placeholder.com/50'}
                alt={mentor.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{mentor.name}</h3>
                <p className="text-sm text-gray-600">{mentor.company || 'Independent Mentor'}</p>
              </div>
            </div>

            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {mentor.expertise?.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="text-yellow-500">⭐</span>
              <span>{mentor.rating?.toFixed(1) || 'N/A'}</span>
              <span>•</span>
              <span>{mentor.sessionsCompleted || 0} sessions</span>
            </div>
          </div>
        </div>

        {/* Match Score */}
        <div className="text-right">
          <div className="text-3xl font-bold text-primary-600">{match.score}%</div>
          <div className="text-sm text-gray-600">Match Score</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <ScoreBar label="Skills" score={match.skillMatchScore} />
        <ScoreBar label="Availability" score={match.availabilityScore} />
        <ScoreBar label="Rating" score={match.ratingScore} />
        {match.semanticScore && (
          <ScoreBar label="AI Match" score={match.semanticScore} />
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleSelectMentor}
        disabled={selecting}
        className="w-full btn btn-primary disabled:opacity-50"
      >
        {selecting ? 'Selecting...' : 'Select This Mentor'}
      </button>
    </div>
  );
};

/**
 * ScoreBar Component
 * Visual representation of score
 */
const ScoreBar = ({ label, score }) => {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default MentorRequest;
