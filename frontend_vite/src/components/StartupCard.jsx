import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

/**
 * StartupCard Component
 * Dark themed card with glassmorphism, gradient borders, and hover effects
 */
const StartupCard = ({ startup, isSelected, onSelect, showActions }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  // Status badge styles for dark theme
  const statusStyles = {
    Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Active: 'bg-green-500/20 text-green-400 border-green-500/30',
    Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    Graduated: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  // Stage emoji and colors
  const stageConfig = {
    Idea: { emoji: '💡', color: 'text-yellow-400' },
    MVP: { emoji: '🛠️', color: 'text-blue-400' },
    'Early-Stage': { emoji: '🌱', color: 'text-green-400' },
    Growth: { emoji: '📈', color: 'text-cyan-400' },
    'Scale-up': { emoji: '🚀', color: 'text-purple-400' },
  };

  const stage = stageConfig[startup.stage] || { emoji: '🔹', color: 'text-white' };

  return (
    <div
      className={`group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isSelected
          ? 'border-accent-orange shadow-accent-orange/20 shadow-lg'
          : 'border-white/10 hover:border-white/20'
        }`}
    >
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-orange/0 to-accent-cyan/0 group-hover:from-accent-orange/5 group-hover:to-accent-cyan/5 transition-all duration-500"></div>

      {/* Selection Checkbox (Admin only) */}
      {onSelect && (
        <div className="absolute top-4 right-4 z-10">
          <label className="relative flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="sr-only peer"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected
                ? 'bg-accent-orange border-accent-orange'
                : 'bg-white/5 border-white/30 hover:border-white/50'
              }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </label>
        </div>
      )}

      {/* Card Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="mb-4">
          <h3
            className="text-xl font-bold text-white mb-2 group-hover:text-accent-orange transition-colors cursor-pointer"
            onClick={() => navigate(`/startups/${startup._id}`)}
          >
            {startup.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusStyles[startup.status]}`}>
              {startup.status}
            </span>
            <span className={`text-sm ${stage.color} flex items-center gap-1`}>
              {stage.emoji} {startup.stage}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-white/60 text-sm mb-4 line-clamp-2 leading-relaxed">
          {startup.shortDesc}
        </p>

        {/* Domain & Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="px-3 py-1 bg-accent-orange/10 text-accent-orange text-xs font-medium rounded-full border border-accent-orange/20">
            {startup.domain}
          </span>
          {startup.tags?.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/5 text-white/60 text-xs font-medium rounded-full border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-white/40 mb-1">Revenue</p>
            <p className="text-lg font-bold text-white">
              ${(startup.kpis?.revenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-white/40 mb-1">Users</p>
            <p className="text-lg font-bold text-white">
              {(startup.kpis?.users || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-white/40 mb-1">Growth</p>
            <p className="text-lg font-bold text-green-400">
              +{startup.kpis?.growth || 0}%
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-white/40 mb-1">Funding</p>
            <p className="text-lg font-bold text-white">
              ${(startup.kpis?.funding || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Mentors */}
        {startup.mentors && startup.mentors.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-white/40 mb-2">Mentors</p>
            <div className="flex -space-x-2">
              {startup.mentors.slice(0, 3).map((mentor, index) => (
                <div
                  key={mentor._id || index}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-orange/30 to-accent-purple/30 border-2 border-[#0a0a0a] flex items-center justify-center"
                  title={mentor.name}
                >
                  <span className="text-xs font-semibold text-white">
                    {mentor.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {startup.mentors.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60">
                  +{startup.mentors.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Founders */}
        <div className="text-xs text-white/40 mb-4 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {startup.founders?.map((f) => f.name).join(', ')}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/startups/${startup._id}`);
              }}
              className="px-4 py-2.5 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all"
            >
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/mentor-request?startup=${startup._id}`);
              }}
              className="px-4 py-2.5 text-sm font-medium text-accent-orange bg-accent-orange/10 border border-accent-orange/20 rounded-xl hover:bg-accent-orange/20 transition-all"
            >
              Request Mentor
            </button>
          </div>
        )}
      </div>

      {/* Pitch Deck Link */}
      {startup.pitchDeckUrl && (
        <div className="px-6 pb-5 relative">
          <a
            href={startup.pitchDeckUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-accent-orange hover:text-orange-400 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Pitch Deck
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default StartupCard;
