import { useState } from 'react';

/**
 * FilterBar Component
 * Dark themed filter bar with glassmorphism design
 */
const FilterBar = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

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

  const stages = ['Idea', 'MVP', 'Early-Stage', 'Growth', 'Scale-up'];

  const statuses = ['Pending', 'Approved', 'Rejected', 'Active', 'Graduated', 'Submitted'];

  const handleInputChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onFilterChange(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      domain: '',
      stage: '',
      status: '',
      search: '',
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="glass-card p-6 mb-6">
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Search
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search startups..."
                value={localFilters.search}
                onChange={(e) => handleInputChange('search', e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Domain Filter */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Domain
            </label>
            <select
              value={localFilters.domain}
              onChange={(e) => handleInputChange('domain', e.target.value)}
              className="input cursor-pointer"
            >
              <option value="" className="bg-dark-900">All Domains</option>
              {domains.map((domain) => (
                <option key={domain} value={domain} className="bg-dark-900">
                  {domain}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Stage
            </label>
            <select
              value={localFilters.stage}
              onChange={(e) => handleInputChange('stage', e.target.value)}
              className="input cursor-pointer"
            >
              <option value="" className="bg-dark-900">All Stages</option>
              {stages.map((stage) => (
                <option key={stage} value={stage} className="bg-dark-900">
                  {stage}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Status
            </label>
            <select
              value={localFilters.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="input cursor-pointer"
            >
              <option value="" className="bg-dark-900">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status} className="bg-dark-900">
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary text-sm"
          >
            Clear Filters
          </button>
          <button
            type="submit"
            className="btn btn-primary text-sm"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterBar;
