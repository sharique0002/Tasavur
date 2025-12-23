import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * MentorRequest Page
 * Redesigned with lavender theme and bento-grid layout
 */
const MentorRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [startups, setStartups] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to request mentorship');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

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
    'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS',
    'AI/ML', 'IoT', 'CleanTech', 'AgriTech', 'Other',
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
      setMatchResults(response.data.data.request);
      setAiSummary(response.data.data.aiSummary);
      setStep(3);
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const styles = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8DFF5 0%, #C9B8E8 50%, #B8A8D8 100%)',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
    },
    decorativeCircle1: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '50%',
      top: '5%',
      right: '10%',
      pointerEvents: 'none',
    },
    decorativeCircle2: {
      position: 'absolute',
      width: '300px',
      height: '300px',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      borderRadius: '50%',
      bottom: '10%',
      left: '5%',
      pointerEvents: 'none',
    },
    container: {
      maxWidth: '1100px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    headerTitle: {
      fontSize: '2.5rem',
      fontWeight: '700',
      color: '#1a1a1a',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
    },
    headerSubtitle: {
      color: 'rgba(0, 0, 0, 0.6)',
      fontSize: '1.1rem',
    },
    bentoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '1rem',
    },
    progressCard: {
      gridColumn: 'span 12',
      background: '#1a1a1a',
      borderRadius: '20px',
      padding: '1.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
    },
    stepCircle: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
    },
    stepCircleActive: {
      background: '#9B7FCB',
      color: 'white',
    },
    stepCircleInactive: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.4)',
    },
    stepLine: {
      width: '80px',
      height: '2px',
      background: 'rgba(255, 255, 255, 0.1)',
    },
    stepLineActive: {
      background: '#9B7FCB',
    },
    stepLabel: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '0.8rem',
      marginTop: '0.5rem',
      textAlign: 'center',
    },
    formCard: {
      gridColumn: 'span 8',
      background: '#1a1a1a',
      borderRadius: '24px',
      padding: '2.5rem',
      color: 'white',
    },
    sideCard: {
      gridColumn: 'span 4',
      background: '#1a1a1a',
      borderRadius: '24px',
      padding: '2rem',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    inputGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      fontSize: '0.9rem',
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '0.5rem',
      fontWeight: '500',
    },
    required: {
      color: '#9B7FCB',
    },
    input: {
      width: '100%',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      color: 'white',
      fontSize: '0.95rem',
      outline: 'none',
      transition: 'all 0.3s ease',
    },
    textarea: {
      width: '100%',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      color: 'white',
      fontSize: '0.95rem',
      outline: 'none',
      resize: 'vertical',
      minHeight: '120px',
      fontFamily: 'inherit',
    },
    select: {
      width: '100%',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      color: 'white',
      fontSize: '0.95rem',
      outline: 'none',
      cursor: 'pointer',
    },
    charCount: {
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: '0.75rem',
      textAlign: 'right',
      marginTop: '0.5rem',
    },
    domainGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
    },
    domainChip: {
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    domainChipActive: {
      background: '#9B7FCB',
      borderColor: '#9B7FCB',
      color: 'white',
    },
    buttonRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '2rem',
      gap: '1rem',
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #9B7FCB 0%, #7C5DAF 100%)',
      border: 'none',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '12px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    btnSecondary: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '12px',
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    statNumber: {
      fontSize: '3rem',
      fontWeight: '300',
      color: '#9B7FCB',
      lineHeight: '1',
    },
    statLabel: {
      fontSize: '0.85rem',
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: '0.5rem',
    },
    infoText: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '0.9rem',
      lineHeight: '1.6',
      marginBottom: '1.5rem',
    },
    skillsContainer: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1rem',
    },
    skillChip: {
      padding: '0.5rem 1rem',
      background: 'rgba(155, 127, 203, 0.2)',
      borderRadius: '20px',
      fontSize: '0.85rem',
      color: '#9B7FCB',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    removeSkill: {
      background: 'none',
      border: 'none',
      color: '#9B7FCB',
      cursor: 'pointer',
      fontSize: '1.1rem',
      padding: '0',
      lineHeight: '1',
    },
    resultsCard: {
      gridColumn: 'span 12',
      background: '#1a1a1a',
      borderRadius: '24px',
      padding: '2.5rem',
      color: 'white',
    },
    aiCard: {
      background: 'linear-gradient(135deg, rgba(155, 127, 203, 0.2) 0%, rgba(155, 127, 203, 0.1) 100%)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '2rem',
      border: '1px solid rgba(155, 127, 203, 0.3)',
    },
    mentorCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease',
    },
    mentorHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem',
    },
    mentorInfo: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
    },
    mentorRank: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      fontSize: '1rem',
    },
    mentorAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover',
    },
    mentorScore: {
      textAlign: 'right',
    },
    scoreNumber: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#9B7FCB',
    },
    scoreLabel: {
      fontSize: '0.75rem',
      color: 'rgba(255, 255, 255, 0.5)',
    },
    scoreGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
      marginBottom: '1rem',
    },
    scoreBar: {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
      height: '6px',
      overflow: 'hidden',
    },
    scoreBarFill: {
      background: '#9B7FCB',
      height: '100%',
      borderRadius: '4px',
    },
    selectBtn: {
      width: '100%',
      background: 'linear-gradient(135deg, #9B7FCB 0%, #7C5DAF 100%)',
      border: 'none',
      color: 'white',
      padding: '1rem',
      borderRadius: '12px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.decorativeCircle1}></div>
      <div style={styles.decorativeCircle2}></div>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>
            <span>🤝</span>
            <span>Request Mentorship</span>
          </h1>
          <p style={styles.headerSubtitle}>
            Get matched with the perfect mentor for your startup journey
          </p>
        </div>

        <div style={styles.bentoGrid}>
          {/* Progress Steps */}
          <div style={styles.progressCard}>
            {[
              { num: 1, label: 'Details' },
              { num: 2, label: 'Skills' },
              { num: 3, label: 'Results' },
            ].map((s, idx) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      ...styles.stepCircle,
                      ...(step >= s.num ? styles.stepCircleActive : styles.stepCircleInactive),
                    }}
                  >
                    {s.num}
                  </div>
                  <div style={styles.stepLabel}>{s.label}</div>
                </div>
                {idx < 2 && (
                  <div
                    style={{
                      ...styles.stepLine,
                      ...(step > s.num ? styles.stepLineActive : {}),
                      margin: '0 1rem',
                      marginBottom: '1.5rem',
                    }}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Form Steps */}
          {step < 3 && (
            <>
              {/* Main Form Card */}
              <div style={styles.formCard}>
                <form onSubmit={handleSubmit}>
                  {/* Step 1: Basic Details */}
                  {step === 1 && (
                    <>
                      <h2 style={styles.sectionTitle}>
                        <span>📋</span> Basic Information
                      </h2>

                      <div style={styles.inputGroup}>
                        <label style={styles.label}>
                          Select Startup <span style={styles.required}>*</span>
                        </label>
                        <select
                          name="startupId"
                          value={formData.startupId}
                          onChange={handleChange}
                          style={styles.select}
                          required
                          onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        >
                          <option value="" style={{ background: '#1a1a1a' }}>Choose a startup...</option>
                          {startups.map((startup) => (
                            <option key={startup._id} value={startup._id} style={{ background: '#1a1a1a' }}>
                              {startup.name} - {startup.stage}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.label}>
                          Mentorship Topic <span style={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          name="topic"
                          value={formData.topic}
                          onChange={handleChange}
                          style={styles.input}
                          placeholder="e.g., Fundraising Strategy, Product-Market Fit"
                          required
                          onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.label}>
                          Detailed Description <span style={styles.required}>*</span>
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          style={styles.textarea}
                          placeholder="Describe what you need help with, your current challenges, and what you hope to achieve..."
                          maxLength="1000"
                          required
                          onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                        <div style={styles.charCount}>{formData.description.length}/1000</div>
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Relevant Domains</label>
                        <div style={styles.domainGrid}>
                          {domains.map((domain) => (
                            <button
                              key={domain}
                              type="button"
                              onClick={() => handleDomainToggle(domain)}
                              style={{
                                ...styles.domainChip,
                                ...(formData.domains.includes(domain) ? styles.domainChipActive : {}),
                              }}
                            >
                              {domain}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Urgency Level</label>
                        <select
                          name="urgency"
                          value={formData.urgency}
                          onChange={handleChange}
                          style={styles.select}
                          onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        >
                          {urgencyLevels.map((level) => (
                            <option key={level} value={level} style={{ background: '#1a1a1a' }}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={styles.buttonRow}>
                        <div></div>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          style={styles.btnPrimary}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 10px 30px rgba(155, 127, 203, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          Next: Add Skills →
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2: Skills */}
                  {step === 2 && (
                    <>
                      <h2 style={styles.sectionTitle}>
                        <span>🎯</span> Skills & Expertise Needed
                      </h2>

                      <div style={styles.inputGroup}>
                        <label style={styles.label}>
                          Add Skills <span style={styles.required}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                            style={{ ...styles.input, flex: 1 }}
                            placeholder="e.g., Marketing, Sales, Fundraising"
                            onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                          />
                          <button
                            type="button"
                            onClick={handleAddSkill}
                            style={{ ...styles.btnPrimary, padding: '1rem 1.5rem' }}
                          >
                            Add
                          </button>
                        </div>
                        <p style={{ ...styles.charCount, textAlign: 'left', marginTop: '0.5rem' }}>
                          Press Enter or click Add to include a skill
                        </p>
                      </div>

                      {formData.skills.length > 0 && (
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>
                            Selected Skills ({formData.skills.length})
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {formData.skills.map((skill) => (
                              <div key={skill} style={styles.skillChip}>
                                <span>{skill}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(skill)}
                                  style={styles.removeSkill}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={styles.buttonRow}>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          style={styles.btnSecondary}
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading || formData.skills.length === 0}
                          style={{
                            ...styles.btnPrimary,
                            opacity: loading || formData.skills.length === 0 ? 0.6 : 1,
                            cursor: loading || formData.skills.length === 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {loading ? 'Matching...' : 'Find Mentors 🔍'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>

              {/* Side Card */}
              <div style={styles.sideCard}>
                <div>
                  <div style={styles.statNumber}>{mentors.length}+</div>
                  <div style={styles.statLabel}>Expert Mentors Available</div>
                </div>
                <div style={{ marginTop: '2rem' }}>
                  <p style={styles.infoText}>
                    Our AI-powered matching engine analyzes your needs and connects you
                    with the most relevant mentors for your startup journey.
                  </p>
                </div>
                <div style={{
                  background: 'rgba(155, 127, 203, 0.15)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginTop: 'auto',
                }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                    💡 Tip: Be specific about your challenges for better mentor matches
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Results */}
          {step === 3 && matchResults && (
            <div style={styles.resultsCard}>
              {aiSummary && (
                <div style={styles.aiCard}>
                  <h3 style={{ color: '#9B7FCB', marginBottom: '0.5rem', fontWeight: '600' }}>
                    🤖 AI Recommendation
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{aiSummary}</p>
                </div>
              )}

              <h2 style={styles.sectionTitle}>
                <span>✨</span> Matched Mentors ({matchResults.matchedMentors?.length || 0})
              </h2>

              {matchResults.matchedMentors && matchResults.matchedMentors.length > 0 ? (
                <div>
                  {matchResults.matchedMentors.map((match, index) => (
                    <MentorMatchCard
                      key={match.mentor._id}
                      match={match}
                      rank={index + 1}
                      requestId={matchResults._id}
                      styles={styles}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  No mentors matched. Try adjusting your criteria.
                </p>
              )}

              <div style={{ ...styles.buttonRow, justifyContent: 'center', marginTop: '2rem' }}>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={styles.btnSecondary}
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => navigate('/mentorship/my-requests')}
                  style={styles.btnPrimary}
                >
                  View My Requests
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * MentorMatchCard Component
 */
const MentorMatchCard = ({ match, rank, requestId, styles }) => {
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
  const rankColors = {
    1: '#FFD700',
    2: '#C0C0C0',
    3: '#CD7F32',
  };

  return (
    <div
      style={styles.mentorCard}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'rgba(155, 127, 203, 0.5)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      }}
    >
      <div style={styles.mentorHeader}>
        <div style={styles.mentorInfo}>
          <div
            style={{
              ...styles.mentorRank,
              background: rankColors[rank] || '#9B7FCB',
              color: rank <= 2 ? '#1a1a1a' : 'white',
            }}
          >
            #{rank}
          </div>
          <img
            src={mentor.avatar || 'https://via.placeholder.com/50'}
            alt={mentor.name}
            style={styles.mentorAvatar}
          />
          <div>
            <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{mentor.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              {mentor.company || 'Independent Mentor'}
            </p>
          </div>
        </div>
        <div style={styles.mentorScore}>
          <div style={styles.scoreNumber}>{match.score}%</div>
          <div style={styles.scoreLabel}>Match Score</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {mentor.expertise?.slice(0, 4).map((skill) => (
          <span
            key={skill}
            style={{
              padding: '0.25rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {skill}
          </span>
        ))}
      </div>

      <div style={styles.scoreGrid}>
        <ScoreBar label="Skills" score={match.skillMatchScore} styles={styles} />
        <ScoreBar label="Availability" score={match.availabilityScore} styles={styles} />
        <ScoreBar label="Rating" score={match.ratingScore} styles={styles} />
        {match.semanticScore && (
          <ScoreBar label="AI Match" score={match.semanticScore} styles={styles} />
        )}
      </div>

      <button
        onClick={handleSelectMentor}
        disabled={selecting}
        style={{
          ...styles.selectBtn,
          opacity: selecting ? 0.6 : 1,
        }}
      >
        {selecting ? 'Selecting...' : 'Select This Mentor'}
      </button>
    </div>
  );
};

/**
 * ScoreBar Component
 */
const ScoreBar = ({ label, score, styles }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div style={styles.scoreBar}>
        <div style={{ ...styles.scoreBarFill, width: `${score}%` }}></div>
      </div>
    </div>
  );
};

export default MentorRequest;
