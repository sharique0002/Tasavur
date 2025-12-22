import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startupAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * Startup Onboarding Page
 * Form to collect startup information with validation
 * Supports file upload for pitch deck
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

  // Stage options
  const stages = ['Idea', 'MVP', 'Early-Stage', 'Growth', 'Scale-up'];

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
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
      // Validate file type
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

      // Validate file size (10MB)
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

    // Validate founders
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
      // Prepare data for submission
      const submitData = new FormData();
      
      // Add basic fields
      submitData.append('name', formData.name);
      submitData.append('shortDesc', formData.shortDesc);
      submitData.append('domain', formData.domain);
      submitData.append('stage', formData.stage);
      submitData.append('website', formData.website);
      
      // Add contact as JSON
      submitData.append('contact', JSON.stringify({
        email: formData.contactEmail,
        phone: formData.contactPhone,
      }));
      
      // Add founders as JSON
      submitData.append('founders', JSON.stringify(formData.founders));
      
      // Add tags
      if (formData.tags) {
        submitData.append('tags', formData.tags);
      }
      
      // Add pitch deck file if present
      if (pitchDeck) {
        submitData.append('pitchDeck', pitchDeck);
      }

      const response = await startupAPI.create(submitData);
      
      toast.success('Startup onboarded successfully! 🎉');
      
      // Redirect to dashboard or startup detail
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 Startup Onboarding
          </h1>
          <p className="text-gray-600">
            Join our incubator and accelerate your startup journey
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Startup Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Startup Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter your startup name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Short Description */}
            <div>
              <label htmlFor="shortDesc" className="block text-sm font-medium text-gray-700 mb-1">
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="shortDesc"
                name="shortDesc"
                rows="4"
                value={formData.shortDesc}
                onChange={handleChange}
                className={`input ${errors.shortDesc ? 'border-red-500' : ''}`}
                placeholder="Describe your startup in 500 characters or less"
                maxLength="500"
              />
              <div className="flex justify-between mt-1">
                {errors.shortDesc && <p className="text-red-500 text-sm">{errors.shortDesc}</p>}
                <p className="text-gray-500 text-sm ml-auto">
                  {formData.shortDesc.length}/500
                </p>
              </div>
            </div>

            {/* Domain and Stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Domain <span className="text-red-500">*</span>
                </label>
                <select
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="input"
                >
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                  Startup Stage <span className="text-red-500">*</span>
                </label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="input"
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Founders Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Founders <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addFounder}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Add Founder
                </button>
              </div>
              
              {formData.founders.map((founder, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Founder {index + 1}</h4>
                    {formData.founders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFounder(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Name"
                        value={founder.name}
                        onChange={(e) => handleFounderChange(index, 'name', e.target.value)}
                        className={`input ${errors[`founder_name_${index}`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`founder_name_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`founder_name_${index}`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={founder.email}
                        onChange={(e) => handleFounderChange(index, 'email', e.target.value)}
                        className={`input ${errors[`founder_email_${index}`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`founder_email_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`founder_email_${index}`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        placeholder="Role (e.g., CEO)"
                        value={founder.role}
                        onChange={(e) => handleFounderChange(index, 'role', e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className={`input ${errors.contactEmail ? 'border-red-500' : ''}`}
                  placeholder="contact@startup.com"
                />
                {errors.contactEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
                )}
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="input"
                placeholder="https://yourstartup.com"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="input"
                placeholder="AI, blockchain, mobile-app"
              />
            </div>

            {/* Pitch Deck Upload */}
            <div>
              <label htmlFor="pitchDeck" className="block text-sm font-medium text-gray-700 mb-1">
                Pitch Deck Upload (Optional)
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  id="pitchDeck"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {pitchDeck && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {pitchDeck.name} ({(pitchDeck.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {errors.pitchDeck && (
                  <p className="text-red-500 text-sm mt-1">{errors.pitchDeck}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: PDF, PPT, PPTX, DOC, DOCX (Max 10MB)
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-sm text-gray-600">
          By submitting, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
};

export default Onboard;
