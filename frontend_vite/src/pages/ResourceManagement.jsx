import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const ResourceManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [analytics, setAnalytics] = useState(null);

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
      setResources(response.data.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await resourceAPI.getAnalytics();
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('description', formData.description);
      data.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(t => t)));
      data.append('visibility', formData.visibility);
      data.append('featured', formData.featured);

      if (formData.videoUrl) data.append('videoUrl', formData.videoUrl);
      if (formData.externalLink) data.append('externalLink', formData.externalLink);
      if (formData.thumbnailUrl) data.append('thumbnailUrl', formData.thumbnailUrl);
      if (file) data.append('file', file);

      if (editingResource) {
        await resourceAPI.update(editingResource._id, data);
        toast.success('Resource updated successfully!');
      } else {
        await resourceAPI.create(data);
        toast.success('Resource created successfully!');
      }

      resetForm();
      fetchResources();
      fetchAnalytics();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error(error.response?.data?.message || 'Failed to save resource');
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
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🛠️ Resource Management
          </h1>
          <p className="text-gray-600">Create and manage resources for the community</p>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Total Resources</h3>
              <p className="text-3xl font-bold">{analytics.totalResources}</p>
            </div>
            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Total Downloads</h3>
              <p className="text-3xl font-bold">{analytics.totalDownloads}</p>
            </div>
            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Total Views</h3>
              <p className="text-3xl font-bold">{analytics.totalViews}</p>
            </div>
            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Avg. Engagement</h3>
              <p className="text-3xl font-bold">
                {analytics.totalResources > 0
                  ? Math.round((analytics.totalDownloads + analytics.totalViews) / analytics.totalResources)
                  : 0}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? '✕ Cancel' : '➕ Create New Resource'}
          </button>
          <button
            onClick={() => navigate('/resources')}
            className="btn bg-white border border-gray-300"
          >
            👁️ View Resource Hub
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingResource ? '✏️ Edit Resource' : '➕ Create New Resource'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="input"
                    placeholder="e.g., Startup Pitch Deck Template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="input"
                  >
                    {resourceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="input"
                  placeholder="Detailed description of the resource..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="e.g., fundraising, pitch, template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Visibility *
                  </label>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleInputChange}
                    required
                    className="input"
                  >
                    <option value="Public">Public</option>
                    <option value="Members Only">Members Only</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Video URL (optional)
                  </label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    External Link (optional)
                  </label>
                  <input
                    type="url"
                    name="externalLink"
                    value={formData.externalLink}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thumbnail URL (optional)
                  </label>
                  <input
                    type="url"
                    name="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload File (optional)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="input"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported: PDF, Word, Excel, PowerPoint, ZIP
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-gray-700 font-medium">⭐ Mark as Featured</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary">
                  {editingResource ? '💾 Update Resource' : '➕ Create Resource'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resources List */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">📋 All Resources</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No resources created yet. Click "Create New Resource" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downloads</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resources.map(resource => (
                    <tr key={resource._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {resource.featured && <span>⭐</span>}
                          <span className="font-medium text-gray-900">{resource.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{resource.type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          resource.visibility === 'Public' ? 'bg-green-100 text-green-700' :
                          resource.visibility === 'Members Only' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {resource.visibility}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">📥 {resource.downloadCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">👁️ {resource.viewCount}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {(user.role === 'admin' || resource.createdBy._id === user._id) && (
                            <>
                              <button
                                onClick={() => handleEdit(resource)}
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(resource._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </>
                          )}
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
  );
};

export default ResourceManagement;
