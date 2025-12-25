import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import DashboardNav from '../components/DashboardNav';

const ResourceManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalResources: 0,
    totalDownloads: 0,
    totalViews: 0,
    typeDistribution: []
  });

  const [formData, setFormData] = useState({
    title: '',
    type: 'Template',
    description: '',
    tags: '',
    visibility: 'Public',
    videoUrl: '',
    externalLink: '',
    thumbnailUrl: '',
    featured: false
  });
  const [file, setFile] = useState(null);

  const resourceTypes = ['Template', 'Course', 'Playbook', 'Video', 'Article', 'Tool', 'Guide', 'Other'];

  useEffect(() => {
    // Check if user has permission
    if (!user || (user.role !== 'admin' && user.role !== 'mentor')) {
      toast.error('Access denied. Admin or Mentor role required.');
      navigate('/dashboard');
      return;
    }

    fetchResources();
    fetchAnalytics();
  }, [user, navigate]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await resourceAPI.getAll({ limit: 100 });
      setResources(response.data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await resourceAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      if (file) {
        formDataToSend.append('file', file);
      }

      if (editingResource) {
        await resourceAPI.update(editingResource._id, formDataToSend);
        toast.success('Resource updated successfully!');
      } else {
        await resourceAPI.create(formDataToSend);
        toast.success('Resource created successfully!');
      }
      
      resetForm();
      fetchResources();
      fetchAnalytics();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error(`Failed to ${editingResource ? 'update' : 'create'} resource: ${error.message}`);
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      type: resource.type,
      description: resource.description,
      tags: resource.tags.join(', '),
      visibility: resource.visibility,
      videoUrl: resource.videoUrl || '',
      externalLink: resource.externalLink || '',
      thumbnailUrl: resource.thumbnailUrl || '',
      featured: resource.featured
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await resourceAPI.delete(id);
      toast.success('Resource deleted successfully!');
      fetchResources();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'Template',
      description: '',
      tags: '',
      visibility: 'Public',
      videoUrl: '',
      externalLink: '',
      thumbnailUrl: '',
      featured: false
    });
    setFile(null);
    setEditingResource(null);
    setShowForm(false);
  };

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="mb-8 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Resource Management
                </h1>
                <p className="text-gray-300">Create, edit and manage educational resources</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {showForm ? 'Cancel' : '+ Create New Resource'}
              </button>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/20 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2">Total Resources</p>
              <p className="text-4xl font-bold text-white">{analytics.totalResources}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20 shadow-lg hover:shadow-green-500/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2">Total Downloads</p>
              <p className="text-4xl font-bold text-white">{analytics.totalDownloads}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2">Total Views</p>
              <p className="text-4xl font-bold text-white">{analytics.totalViews}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/20 shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2">Resource Types</p>
              <p className="text-4xl font-bold text-white">{analytics.typeDistribution?.length || 0}</p>
            </div>
          </div>

          {/* Create/Edit Form */}
          {showForm && (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingResource ? 'Edit Resource' : 'Create New Resource'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter resource title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    >
                      {resourceTypes.map(type => (
                        <option key={type} value={type} className="bg-gray-800">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-200 text-sm font-semibold mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows="4"
                    placeholder="Describe the resource"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., startup, funding, marketing"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2">
                      Visibility *
                    </label>
                    <select
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="Public" className="bg-gray-800">Public</option>
                      <option value="Members Only" className="bg-gray-800">Members Only</option>
                      <option value="Private" className="bg-gray-800">Private</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2">
                      Video URL (optional)
                    </label>
                    <input
                      type="url"
                      name="videoUrl"
                      value={formData.videoUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2">
                      External Link (optional)
                    </label>
                    <input
                      type="url"
                      name="externalLink"
                      value={formData.externalLink}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="https://example.com/..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-200 text-sm font-semibold mb-2">
                    Thumbnail URL (optional)
                  </label>
                  <input
                    type="url"
                    name="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-gray-200 text-sm font-semibold mb-2">
                    Upload File (optional)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer transition-all"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-500 bg-gray-900/50 border-gray-700 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label className="ml-3 text-gray-200 text-sm font-semibold">
                    Featured Resource
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
                  >
                    {editingResource ? 'Update Resource' : 'Create Resource'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Resources Table */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">All Resources</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No resources found. Create your first resource!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Visibility</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Stats</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Featured</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {resources.map((resource) => (
                      <tr 
                        key={resource._id} 
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{resource.title}</div>
                          <div className="text-gray-400 text-sm mt-1 line-clamp-1">{resource.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {resource.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            resource.visibility === 'Public' 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                              : resource.visibility === 'Members Only'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {resource.visibility}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {resource.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              {resource.downloads}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {resource.featured ? (
                            <span className="flex items-center text-yellow-400">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(resource)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(resource._id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResourceManagement;
