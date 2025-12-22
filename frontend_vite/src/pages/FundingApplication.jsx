import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fundingAPI } from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * FundingApplication Page
 * Form to apply for startup funding
 */
const FundingApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const startup = location.state?.startup;

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    startupId: startup?._id || '',
    roundType: 'Seed',
    amountRequested: '',
    currency: 'USD',
    purpose: '',
    useOfFunds: {
      breakdown: [
        { category: 'Product Development', amount: '', percentage: 0, description: '' },
      ],
      totalAllocated: 0,
    },
    currentMetrics: {
      revenue: '',
      monthlyBurnRate: '',
      runway: '',
      customers: '',
      growth: '',
    },
    milestones: [
      { title: '', description: '', targetDate: '', status: 'Planned' },
    ],
    timeline: {
      expectedCloseDate: '',
      useOfFundsTimeline: '12',
    },
  });

  const roundTypes = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Bridge', 'Grant', 'Other'];
  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'Other'];
  const fundCategories = ['Product Development', 'Marketing', 'Operations', 'Hiring', 'Infrastructure', 'R&D', 'Other'];

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to apply for funding');
      navigate('/login');
      return;
    }

    if (!startup) {
      toast.error('Please select a startup first');
      navigate('/dashboard');
    }
  }, [isAuthenticated, startup, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMetricsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      currentMetrics: {
        ...prev.currentMetrics,
        [name]: value,
      },
    }));
  };

  const handleTimelineChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        [name]: value,
      },
    }));
  };

  const handleFundsBreakdownChange = (index, field, value) => {
    const newBreakdown = [...formData.useOfFunds.breakdown];
    newBreakdown[index] = { ...newBreakdown[index], [field]: value };

    // Recalculate percentages
    const total = parseFloat(formData.amountRequested) || 0;
    if (total > 0 && field === 'amount') {
      newBreakdown[index].percentage = Math.round((parseFloat(value) / total) * 100);
    }

    const totalAllocated = newBreakdown.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    setFormData(prev => ({
      ...prev,
      useOfFunds: {
        breakdown: newBreakdown,
        totalAllocated,
      },
    }));
  };

  const addFundsCategory = () => {
    setFormData(prev => ({
      ...prev,
      useOfFunds: {
        ...prev.useOfFunds,
        breakdown: [
          ...prev.useOfFunds.breakdown,
          { category: 'Other', amount: '', percentage: 0, description: '' },
        ],
      },
    }));
  };

  const removeFundsCategory = (index) => {
    const newBreakdown = formData.useOfFunds.breakdown.filter((_, i) => i !== index);
    const totalAllocated = newBreakdown.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    setFormData(prev => ({
      ...prev,
      useOfFunds: {
        breakdown: newBreakdown,
        totalAllocated,
      },
    }));
  };

  const handleMilestoneChange = (index, field, value) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      milestones: newMilestones,
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { title: '', description: '', targetDate: '', status: 'Planned' },
      ],
    }));
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (stepNum) => {
    switch (stepNum) {
      case 1:
        if (!formData.roundType || !formData.amountRequested || !formData.purpose) {
          toast.error('Please fill in all required fields');
          return false;
        }
        if (parseFloat(formData.amountRequested) <= 0) {
          toast.error('Amount must be greater than 0');
          return false;
        }
        return true;
      case 2:
        if (formData.useOfFunds.breakdown.length === 0) {
          toast.error('Please add at least one use of funds category');
          return false;
        }
        return true;
      case 3:
        return true; // Metrics are optional
      case 4:
        return true; // Timeline is optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (saveAsDraft = false) => {
    if (!saveAsDraft && !validateStep(step)) return;

    try {
      setLoading(true);

      // Prepare data
      const submitData = {
        startupId: formData.startupId,
        roundType: formData.roundType,
        amountRequested: parseFloat(formData.amountRequested),
        currency: formData.currency,
        purpose: formData.purpose,
        useOfFunds: {
          breakdown: formData.useOfFunds.breakdown
            .filter(item => item.amount)
            .map(item => ({
              ...item,
              amount: parseFloat(item.amount),
            })),
          totalAllocated: formData.useOfFunds.totalAllocated,
        },
        currentMetrics: {
          revenue: parseFloat(formData.currentMetrics.revenue) || 0,
          monthlyBurnRate: parseFloat(formData.currentMetrics.monthlyBurnRate) || 0,
          runway: parseFloat(formData.currentMetrics.runway) || 0,
          customers: parseInt(formData.currentMetrics.customers) || 0,
          growth: parseFloat(formData.currentMetrics.growth) || 0,
        },
        milestones: formData.milestones.filter(m => m.title),
        timeline: formData.timeline,
      };

      const response = await fundingAPI.create(submitData);

      if (!saveAsDraft) {
        // Submit the application
        await fundingAPI.submit(response.data.data._id);
        toast.success('Funding application submitted successfully! 🎉');
      } else {
        toast.success('Application saved as draft');
      }

      navigate('/dashboard');

    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!startup) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <img
                src="/src/assets/logo.jpg"
                alt="Tasavur"
                className="w-10 h-10 rounded-full shadow-lg shadow-purple-500/30"
              />
              <span className="font-aref text-2xl font-bold gradient-text-colorful">Tasavur</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-white/60 text-sm">{user?.name}</span>
              <button onClick={logout} className="btn btn-secondary text-sm py-2">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            💰 Apply for Funding
          </h1>
          <p className="text-gray-400">
            Submit your funding application for <span className="text-orange-400 font-semibold">{startup.name}</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    s === step
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                      : s < step
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded ${
                      s < step ? 'bg-green-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-400">
              {step === 1 && 'Basic Information'}
              {step === 2 && 'Use of Funds'}
              {step === 3 && 'Current Metrics'}
              {step === 4 && 'Timeline & Milestones'}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Round Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="roundType"
                    value={formData.roundType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {roundTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {currencies.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount Requested <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
                  </span>
                  <input
                    type="number"
                    name="amountRequested"
                    value={formData.amountRequested}
                    onChange={handleChange}
                    placeholder="500000"
                    className="input-field pl-10"
                    min="0"
                  />
                </div>
                {formData.amountRequested && (
                  <p className="text-sm text-orange-400 mt-1">
                    {formatCurrency(formData.amountRequested)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe how you plan to use this funding and what you aim to achieve..."
                  className="input-field resize-none"
                  maxLength={2000}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.purpose.length}/2000 characters
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Use of Funds */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Use of Funds Breakdown</h2>
                <button
                  type="button"
                  onClick={addFundsCategory}
                  className="btn btn-secondary text-sm"
                >
                  + Add Category
                </button>
              </div>

              {formData.useOfFunds.breakdown.map((item, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-white font-medium">Category {index + 1}</h3>
                    {formData.useOfFunds.breakdown.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFundsCategory(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => handleFundsBreakdownChange(index, 'category', e.target.value)}
                        className="input-field text-sm"
                      >
                        {fundCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Amount</label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleFundsBreakdownChange(index, 'amount', e.target.value)}
                        placeholder="100000"
                        className="input-field text-sm"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Percentage</label>
                      <div className="input-field text-sm bg-white/5 flex items-center">
                        {item.percentage || 0}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleFundsBreakdownChange(index, 'description', e.target.value)}
                      placeholder="Brief description of how funds will be used"
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-xl p-4 border border-orange-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Allocated</span>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(formData.useOfFunds.totalAllocated)}
                  </span>
                </div>
                {formData.amountRequested && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400 text-sm">Remaining</span>
                    <span className={`text-sm font-medium ${
                      formData.amountRequested - formData.useOfFunds.totalAllocated >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {formatCurrency(formData.amountRequested - formData.useOfFunds.totalAllocated)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Current Metrics */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-4">Current Metrics</h2>
              <p className="text-gray-400 text-sm mb-6">
                Provide your current business metrics to help investors understand your traction.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Revenue ({formData.currency})
                  </label>
                  <input
                    type="number"
                    name="revenue"
                    value={formData.currentMetrics.revenue}
                    onChange={handleMetricsChange}
                    placeholder="0"
                    className="input-field"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Burn Rate ({formData.currency})
                  </label>
                  <input
                    type="number"
                    name="monthlyBurnRate"
                    value={formData.currentMetrics.monthlyBurnRate}
                    onChange={handleMetricsChange}
                    placeholder="0"
                    className="input-field"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Runway (months)
                  </label>
                  <input
                    type="number"
                    name="runway"
                    value={formData.currentMetrics.runway}
                    onChange={handleMetricsChange}
                    placeholder="0"
                    className="input-field"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Customers
                  </label>
                  <input
                    type="number"
                    name="customers"
                    value={formData.currentMetrics.customers}
                    onChange={handleMetricsChange}
                    placeholder="0"
                    className="input-field"
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Growth Rate (%)
                  </label>
                  <input
                    type="number"
                    name="growth"
                    value={formData.currentMetrics.growth}
                    onChange={handleMetricsChange}
                    placeholder="0"
                    className="input-field"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Timeline & Milestones */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-4">Timeline & Milestones</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    name="expectedCloseDate"
                    value={formData.timeline.expectedCloseDate}
                    onChange={handleTimelineChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Use of Funds Timeline (months)
                  </label>
                  <select
                    name="useOfFundsTimeline"
                    value={formData.timeline.useOfFundsTimeline}
                    onChange={handleTimelineChange}
                    className="input-field"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Key Milestones</h3>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="btn btn-secondary text-sm"
                >
                  + Add Milestone
                </button>
              </div>

              {formData.milestones.map((milestone, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-white font-medium">Milestone {index + 1}</h4>
                    {formData.milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Title</label>
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                        placeholder="e.g., Launch MVP"
                        className="input-field text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Target Date</label>
                      <input
                        type="date"
                        value={milestone.targetDate}
                        onChange={(e) => handleMilestoneChange(index, 'targetDate', e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={milestone.description}
                        onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                        placeholder="Brief description of this milestone"
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="btn btn-secondary"
              >
                Save Draft
              </button>

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Application 🚀'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FundingApplication;
