import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startupAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * Startup Onboarding Page
 * Redesigned with lavender theme and bento-grid layout
 */
const Onboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    shortDesc: '',
    domain: 'FinTech',
    stage: 'Idea',
    website: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    founders: [{ name: user?.name || '', email: user?.email || '', role: 'CEO' }],
    tags: '',
  });

  const [pitchDeck, setPitchDeck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Domain options
  const domains = [
    'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS',
    'AI/ML', 'IoT', 'CleanTech', 'AgriTech', 'Other',
  ];

  // Stage options
  const stages = ['Idea', 'MVP', 'Early-Stage', 'Growth', 'Scale-up'];

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle founder change
  const handleFounderChange = (index, field, value) => {
    const newFounders = [...formData.founders];
    newFounders[index][field] = value;
    setFormData((prev) => ({ ...prev, founders: newFounders }));
  };

  // Add founder
  const addFounder = () => {
    setFormData((prev) => ({
      ...prev,
      founders: [...prev.founders, { name: '', email: '', role: 'Co-Founder' }],
    }));
  };

  // Remove founder
  const removeFounder = (index) => {
    if (formData.founders.length > 1) {
      const newFounders = formData.founders.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, founders: newFounders }));
    }
  };

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          pitchDeck: 'Only PDF, PPT, PPTX files are allowed',
        }));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          pitchDeck: 'File size must be less than 10MB',
        }));
        return;
      }

      setPitchDeck(file);
      setErrors((prev) => ({ ...prev, pitchDeck: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Startup name is required';
    if (!formData.shortDesc.trim()) newErrors.shortDesc = 'Description is required';
    if (formData.shortDesc.length > 500) {
      newErrors.shortDesc = 'Description cannot exceed 500 characters';
    }
    if (!formData.domain) newErrors.domain = 'Domain is required';
    if (!formData.stage) newErrors.stage = 'Stage is required';
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    formData.founders.forEach((founder, index) => {
      if (!founder.name.trim()) {
        newErrors[`founder_name_${index}`] = 'Founder name is required';
      }
      if (!founder.email.trim()) {
        newErrors[`founder_email_${index}`] = 'Founder email is required';
      } else if (!/^\S+@\S+\.\S+$/.test(founder.email)) {
        newErrors[`founder_email_${index}`] = 'Invalid email format';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix all validation errors');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();

      submitData.append('name', formData.name);
      submitData.append('shortDesc', formData.shortDesc);
      submitData.append('domain', formData.domain);
      submitData.append('stage', formData.stage);
      submitData.append('website', formData.website);

      submitData.append('contact', JSON.stringify({
        email: formData.contactEmail,
        phone: formData.contactPhone,
      }));

      submitData.append('founders', JSON.stringify(formData.founders));

      if (formData.tags) {
        submitData.append('tags', formData.tags);
      }

      if (pitchDeck) {
        submitData.append('pitchDeck', pitchDeck);
      }

      await startupAPI.create(submitData);

      toast.success('Startup onboarded successfully! 🎉');

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
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
      width: '500px',
      height: '500px',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '50%',
      top: '10%',
      left: '50%',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
    },
    decorativeCircle2: {
      position: 'absolute',
      width: '300px',
      height: '300px',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '50%',
      bottom: '20%',
      right: '10%',
      pointerEvents: 'none',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
    },
    bentoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '1rem',
    },
    heroCard: {
      gridColumn: 'span 7',
      background: '#1a1a1a',
      borderRadius: '24px',
      padding: '3rem',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    },
    bracket: {
      fontSize: '4rem',
      fontWeight: '300',
      color: '#9B7FCB',
      lineHeight: '1',
      marginRight: '0.5rem',
    },
    heroTitle: {
      fontSize: '3.5rem',
      fontWeight: '700',
      lineHeight: '1.1',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
    },
    heroTitleText: {
      display: 'flex',
      flexDirection: 'column',
    },
    infoCard: {
      gridColumn: 'span 5',
      background: '#1a1a1a',
      borderRadius: '24px',
      padding: '2.5rem',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    infoText: {
      fontSize: '0.95rem',
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: '1.6',
      marginBottom: '2rem',
    },
    ctaButton: {
      background: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '50px',
      fontSize: '0.85rem',
      fontWeight: '500',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      transition: 'all 0.3s ease',
      width: 'fit-content',
    },
    statCard: {
      background: '#1a1a1a',
      borderRadius: '24px',
      padding: '2rem',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    },
    statNumber: {
      fontSize: '4rem',
      fontWeight: '300',
      lineHeight: '1',
      marginBottom: '0.5rem',
    },
    statLabel: {
      fontSize: '0.8rem',
      color: 'rgba(255, 255, 255, 0.5)',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    formCard: {
      gridColumn: 'span 12',
      background: '#1a1a1a',
      borderRadius: '24px',
      padding: '2.5rem',
      color: 'white',
      marginTop: '0.5rem',
    },
    formTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    inputGroupFull: {
      gridColumn: 'span 2',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    label: {
      fontSize: '0.85rem',
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '500',
    },
    required: {
      color: '#9B7FCB',
    },
    input: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      color: 'white',
      fontSize: '0.95rem',
      outline: 'none',
      transition: 'all 0.3s ease',
    },
    inputError: {
      borderColor: '#ef4444',
    },
    textarea: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      color: 'white',
      fontSize: '0.95rem',
      outline: 'none',
      resize: 'vertical',
      minHeight: '100px',
      fontFamily: 'inherit',
    },
    select: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      color: 'white',
      fontSize: '0.95rem',
      outline: 'none',
      cursor: 'pointer',
    },
    errorText: {
      color: '#ef4444',
      fontSize: '0.8rem',
    },
    charCount: {
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: '0.75rem',
      textAlign: 'right',
    },
    foundersSection: {
      gridColumn: 'span 2',
      marginTop: '1rem',
    },
    founderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
    },
    addButton: {
      background: 'transparent',
      border: 'none',
      color: '#9B7FCB',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
    },
    founderCard: {
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '1rem',
    },
    founderCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
    },
    founderNumber: {
      fontSize: '0.9rem',
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.8)',
    },
    removeButton: {
      background: 'transparent',
      border: 'none',
      color: '#ef4444',
      fontSize: '0.85rem',
      cursor: 'pointer',
    },
    founderInputGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem',
    },
    fileUpload: {
      gridColumn: 'span 2',
      marginTop: '1rem',
    },
    fileInput: {
      display: 'none',
    },
    fileLabel: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      background: 'rgba(155, 127, 203, 0.1)',
      border: '2px dashed rgba(155, 127, 203, 0.3)',
      borderRadius: '16px',
      padding: '2rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    fileSelected: {
      color: '#10b981',
      fontSize: '0.9rem',
      marginTop: '0.5rem',
    },
    fileHint: {
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: '0.75rem',
      marginTop: '0.5rem',
    },
    submitSection: {
      gridColumn: 'span 2',
      marginTop: '1.5rem',
    },
    submitButton: {
      width: '100%',
      background: 'linear-gradient(135deg, #9B7FCB 0%, #7C5DAF 100%)',
      border: 'none',
      color: 'white',
      padding: '1.25rem 2rem',
      borderRadius: '16px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: 'white',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    footer: {
      textAlign: 'center',
      marginTop: '1.5rem',
      fontSize: '0.85rem',
      color: 'rgba(0, 0, 0, 0.5)',
    },
  };

  return (
    <div style={styles.page}>
      {/* Decorative circles */}
      <div style={styles.decorativeCircle1}></div>
      <div style={styles.decorativeCircle2}></div>

      <div style={styles.container}>
        <div style={styles.bentoGrid}>
          {/* Hero Card */}
          <div style={styles.heroCard}>
            <div style={styles.heroTitle}>
              <span style={styles.bracket}>💡</span>
              <div style={styles.heroTitleText}>
                <span>Tasavur</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>Where Every Idea</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Has a Future</span>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div style={styles.infoCard}>
            <p style={styles.infoText}>
              Join our premier incubator platform to connect with world-class mentors,
              access premium resources, and transform your startup into the next success story.
            </p>
            <button
              style={styles.ctaButton}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onClick={() => document.getElementById('startup-form').scrollIntoView({ behavior: 'smooth' })}
            >
              Get Started
            </button>
          </div>

          {/* Stat Card 1 */}
          <div style={{ ...styles.statCard, gridColumn: 'span 4' }}>
            <div style={styles.statNumber}>500+</div>
            <div style={styles.statLabel}>Startups Launched</div>
          </div>

          {/* Stat Card 2 */}
          <div style={{ ...styles.statCard, gridColumn: 'span 4' }}>
            <div style={{ ...styles.statNumber, color: '#9B7FCB' }}>150+</div>
            <div style={styles.statLabel}>Expert Mentors</div>
          </div>

          {/* Stat Card 3 */}
          <div style={{ ...styles.statCard, gridColumn: 'span 4' }}>
            <div style={styles.statNumber}>$50M+</div>
            <div style={styles.statLabel}>Funding Raised</div>
          </div>

          {/* Form Card */}
          <div id="startup-form" style={styles.formCard}>
            <div style={styles.formTitle}>
              <span>🚀</span>
              <span>Register Your Startup</span>
            </div>

            <form onSubmit={handleSubmit} style={styles.formGrid}>
              {/* Startup Name */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Startup Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your startup name"
                  style={{
                    ...styles.input,
                    ...(errors.name ? styles.inputError : {}),
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                  onBlur={(e) => e.target.style.borderColor = errors.name ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}
                />
                {errors.name && <span style={styles.errorText}>{errors.name}</span>}
              </div>

              {/* Domain */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Business Domain <span style={styles.required}>*</span>
                </label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  style={styles.select}
                >
                  {domains.map((domain) => (
                    <option key={domain} value={domain} style={{ background: '#1a1a1a' }}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              {/* Short Description */}
              <div style={styles.inputGroupFull}>
                <label style={styles.label}>
                  Short Description <span style={styles.required}>*</span>
                </label>
                <textarea
                  name="shortDesc"
                  value={formData.shortDesc}
                  onChange={handleChange}
                  placeholder="Describe your startup in 500 characters or less"
                  maxLength="500"
                  style={{
                    ...styles.textarea,
                    ...(errors.shortDesc ? styles.inputError : {}),
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                  onBlur={(e) => e.target.style.borderColor = errors.shortDesc ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {errors.shortDesc && <span style={styles.errorText}>{errors.shortDesc}</span>}
                  <span style={styles.charCount}>{formData.shortDesc.length}/500</span>
                </div>
              </div>

              {/* Stage */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Startup Stage <span style={styles.required}>*</span>
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  style={styles.select}
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage} style={{ background: '#1a1a1a' }}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              {/* Website */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourstartup.com"
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>

              {/* Contact Email */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Contact Email <span style={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="contact@startup.com"
                  style={{
                    ...styles.input,
                    ...(errors.contactEmail ? styles.inputError : {}),
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                  onBlur={(e) => e.target.style.borderColor = errors.contactEmail ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}
                />
                {errors.contactEmail && <span style={styles.errorText}>{errors.contactEmail}</span>}
              </div>

              {/* Contact Phone */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>

              {/* Tags */}
              <div style={styles.inputGroupFull}>
                <label style={styles.label}>Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="AI, blockchain, mobile-app"
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>

              {/* Founders Section */}
              <div style={styles.foundersSection}>
                <div style={styles.founderHeader}>
                  <label style={styles.label}>
                    Founders <span style={styles.required}>*</span>
                  </label>
                  <button type="button" onClick={addFounder} style={styles.addButton}>
                    + Add Founder
                  </button>
                </div>

                {formData.founders.map((founder, index) => (
                  <div key={index} style={styles.founderCard}>
                    <div style={styles.founderCardHeader}>
                      <span style={styles.founderNumber}>Founder {index + 1}</span>
                      {formData.founders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFounder(index)}
                          style={styles.removeButton}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={styles.founderInputGrid}>
                      <div>
                        <input
                          type="text"
                          placeholder="Name"
                          value={founder.name}
                          onChange={(e) => handleFounderChange(index, 'name', e.target.value)}
                          style={{
                            ...styles.input,
                            ...(errors[`founder_name_${index}`] ? styles.inputError : {}),
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                          onBlur={(e) => e.target.style.borderColor = errors[`founder_name_${index}`] ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}
                        />
                        {errors[`founder_name_${index}`] && (
                          <span style={styles.errorText}>{errors[`founder_name_${index}`]}</span>
                        )}
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Email"
                          value={founder.email}
                          onChange={(e) => handleFounderChange(index, 'email', e.target.value)}
                          style={{
                            ...styles.input,
                            ...(errors[`founder_email_${index}`] ? styles.inputError : {}),
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                          onBlur={(e) => e.target.style.borderColor = errors[`founder_email_${index}`] ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}
                        />
                        {errors[`founder_email_${index}`] && (
                          <span style={styles.errorText}>{errors[`founder_email_${index}`]}</span>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Role (e.g., CEO)"
                          value={founder.role}
                          onChange={(e) => handleFounderChange(index, 'role', e.target.value)}
                          style={styles.input}
                          onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* File Upload */}
              <div style={styles.fileUpload}>
                <label style={styles.label}>Pitch Deck (Optional)</label>
                <input
                  type="file"
                  id="pitchDeck"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                />
                <label
                  htmlFor="pitchDeck"
                  style={styles.fileLabel}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#9B7FCB';
                    e.currentTarget.style.background = 'rgba(155, 127, 203, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(155, 127, 203, 0.3)';
                    e.currentTarget.style.background = 'rgba(155, 127, 203, 0.1)';
                  }}
                >
                  <span>📎</span>
                  <span>Drop your pitch deck here or click to browse</span>
                </label>
                {pitchDeck && (
                  <div style={styles.fileSelected}>
                    ✓ {pitchDeck.name} ({(pitchDeck.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                {errors.pitchDeck && <span style={styles.errorText}>{errors.pitchDeck}</span>}
                <div style={styles.fileHint}>
                  Accepted formats: PDF, PPT, PPTX, DOC, DOCX (Max 10MB)
                </div>
              </div>

              {/* Submit Button */}
              <div style={styles.submitSection}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.submitButton,
                    ...(loading ? styles.submitButtonDisabled : {}),
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 10px 30px rgba(155, 127, 203, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {loading ? (
                    <>
                      <div style={styles.spinner}></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          By submitting, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>

      {/* Keyframes for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Onboard;
