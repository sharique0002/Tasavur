import { useState } from 'react';
import { resourceAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

/**
 * ResourceCard Component
 * Dark themed resource card with glassmorphism and hover effects
 */
const ResourceCard = ({ resource }) => {
  const { user } = useAuthStore();
  const [downloading, setDownloading] = useState(false);

  const getTypeIcon = (type) => {
    const icons = {
      Template: '📄',
      Course: '🎓',
      Playbook: '📖',
      Video: '🎥',
      Article: '📰',
      Tool: '🛠️',
      Guide: '🗺️',
      Other: '📦'
    };
    return icons[type] || '📦';
  };

  const getTypeStyles = (type) => {
    const styles = {
      Template: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Course: 'bg-green-500/20 text-green-400 border-green-500/30',
      Playbook: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      Video: 'bg-red-500/20 text-red-400 border-red-500/30',
      Article: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Tool: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      Guide: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      Other: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await resourceAPI.recordDownload(resource._id);

      if (response.data.data.fileUrl) {
        window.open(response.data.data.fileUrl, '_blank');
      } else if (response.data.data.externalLink) {
        window.open(response.data.data.externalLink, '_blank');
      }

      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.message || 'Failed to download resource');
    } finally {
      setDownloading(false);
    }
  };

  const handleView = () => {
    window.location.href = `/resources/${resource._id}`;
  };

  const canAccess = () => {
    if (resource.visibility === 'Public') return true;
    if (resource.visibility === 'Members Only' && user) return true;
    if (resource.visibility === 'Private' && user?.role === 'admin') return true;
    return false;
  };

  return (
    <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col h-full">
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/0 to-accent-cyan/0 group-hover:from-accent-purple/5 group-hover:to-accent-cyan/5 transition-all duration-500 pointer-events-none"></div>

      {/* Thumbnail or Icon */}
      <div className="relative h-48 bg-gradient-to-br from-white/5 to-white/10 overflow-hidden">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl opacity-80 group-hover:scale-110 transition-transform">{getTypeIcon(resource.type)}</span>
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent"></div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeStyles(resource.type)}`}>
            {resource.type}
          </span>
          {resource.featured && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Visibility Badge */}
        {resource.visibility !== 'Public' && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-white border border-white/20">
              {resource.visibility === 'Members Only' ? '🔒 Members' : '🔐 Private'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative flex flex-col flex-1 p-5">
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-accent-orange transition-colors">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-white/60 text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">
          {resource.description}
        </p>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/5 text-white/50 rounded-lg text-xs border border-white/10"
              >
                #{tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="px-2 py-1 bg-white/5 text-white/50 rounded-lg text-xs border border-white/10">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-white/40">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {resource.downloadCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {resource.viewCount || 0}
          </span>
          {resource.fileSize && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {formatFileSize(resource.fileSize)}
            </span>
          )}
        </div>

        {/* Creator */}
        {resource.createdBy && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <div className="w-6 h-6 bg-gradient-to-br from-accent-orange to-accent-purple rounded-full flex items-center justify-center text-white text-xs font-bold">
              {resource.createdBy.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-white/70">{resource.createdBy.name}</span>
            <span className="text-xs text-white/40">({resource.createdBy.role})</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-auto pt-4 border-t border-white/10">
          <button
            onClick={handleView}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>

          {canAccess() && (resource.fileUrl || resource.externalLink) && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-accent-orange to-orange-600 rounded-xl hover:shadow-lg hover:shadow-accent-orange/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </>
              )}
            </button>
          )}

          {!canAccess() && (
            <button
              disabled
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white/30 bg-white/5 rounded-xl cursor-not-allowed border border-white/5 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Login Required
            </button>
          )}
        </div>

        {/* Video Indicator */}
        {resource.videoUrl && (
          <div className="mt-3 text-center">
            <span className="text-xs text-accent-purple font-medium flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Includes Video Content
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceCard;
