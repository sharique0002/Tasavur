import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resourceAPI } from '../services/api';
import ResourceCard from '../components/ResourceCard';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ResourceHub = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    tags: '',
    sortBy: 'recent',
    featured: false
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [popularResources, setPopularResources] = useState([]);

  const resourceTypes = [
    'Template',
    'Course',
    'Playbook',
    'Video',
    'Article',
    'Tool',
    'Guide',
    'Other'
  ];

  useEffect(() => {
    fetchResources();
    fetchTags();
    fetchPopularResources();
  }, [page, filters]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...filters
      };

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === false) {
          delete params[key];
        }
      });

      const response = await resourceAPI.getAll(params);
      setResources(response.data.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await resourceAPI.getTags();
      setAvailableTags(response.data.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchPopularResources = async () => {
    try {
      const response = await resourceAPI.getPopular(5);
      setPopularResources(response.data.data);
    } catch (error) {
      console.error('Error fetching popular resources:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResources();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      tags: '',
      sortBy: 'recent',
      featured: false
    });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/src/assets/logo.jpg"
                alt="Tasavur"
                className="w-14 h-14 rounded-full shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow object-cover"
              />
              <span className="font-aref text-3xl font-bold gradient-text-colorful hidden sm:block">Tasavur</span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/resources" className="text-accent-orange font-medium">Resources</Link>
            </div>

            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <span className="text-white/60 text-sm hidden sm:block">{user?.name}</span>
                  <button onClick={logout} className="btn btn-secondary text-sm py-2">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost text-sm py-2">Login</Link>
                  <Link to="/register" className="btn btn-primary text-sm py-2">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-[150px]"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[150px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-display mb-4">
            Resource <span className="gradient-text">Hub</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Curated templates, courses, playbooks, and tools to accelerate your startup journey
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Filters Section */}
        <div className="glass-card p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="input pl-12"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input cursor-pointer"
              >
                <option value="" className="bg-dark-900">All Types</option>
                {resourceTypes.map(type => (
                  <option key={type} value={type} className="bg-dark-900">{type}</option>
                ))}
              </select>

              {/* Tag Filter */}
              <select
                value={filters.tags}
                onChange={(e) => handleFilterChange('tags', e.target.value)}
                className="input cursor-pointer"
              >
                <option value="" className="bg-dark-900">All Tags</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag} className="bg-dark-900">
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="input cursor-pointer"
              >
                <option value="recent" className="bg-dark-900">Most Recent</option>
                <option value="popular" className="bg-dark-900">Most Popular</option>
                <option value="downloads" className="bg-dark-900">Most Downloaded</option>
                <option value="views" className="bg-dark-900">Most Viewed</option>
              </select>

              {/* Clear Filters */}
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </div>

            {/* Featured Toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${filters.featured ? 'bg-accent-orange' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${filters.featured ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
              </div>
              <span className="text-white/70 group-hover:text-white transition-colors">Show Featured Only</span>
            </label>
          </form>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Resources Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="spinner w-12 h-12"></div>
              </div>
            ) : resources.length === 0 ? (
              <div className="glass-card text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-5xl">📭</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No Resources Found</h3>
                <p className="text-white/60 mb-8 max-w-md mx-auto">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="btn btn-primary">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {resources.map((resource, index) => (
                    <div
                      key={resource._id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ResourceCard resource={resource} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-white/70 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </span>
                    </button>

                    <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-white font-medium">
                      Page {page} of {totalPages}
                    </span>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm font-medium text-white/70 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center gap-1">
                        Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Popular Resources Sidebar */}
          <div className="hidden lg:block">
            <div className="glass-card sticky top-24">
              <div className="p-5 border-b border-white/10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  🔥 Popular Resources
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {popularResources.map((resource, index) => (
                  <div
                    key={resource._id}
                    className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                    onClick={() => window.location.href = `/resources/${resource._id}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg font-bold gradient-text">#{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm truncate group-hover:text-accent-orange transition-colors">
                          {resource.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {resource.downloadCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {resource.viewCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceHub;
