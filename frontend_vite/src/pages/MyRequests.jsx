import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';
import { format } from 'date-fns';

/**
 * MyRequests Page
 * Displays user's mentorship requests and their status
 */
const MyRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, matched, scheduled, completed

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/mentorship/requests', { params });
      setRequests(response.data.data);
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Matched: 'bg-blue-100 text-blue-800',
    Scheduled: 'bg-purple-100 text-purple-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Mentorship Requests</h1>
            <p className="text-gray-600 mt-1">Track and manage your mentorship sessions</p>
          </div>
          <button
            onClick={() => navigate('/mentor-request')}
            className="btn btn-primary"
          >
            + New Request
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-2 flex space-x-2">
          {['all', 'Pending', 'Matched', 'Scheduled', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status.toLowerCase())}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status.toLowerCase()
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Requests List */}
        {!loading && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/mentorship/requests/${request._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{request.topic}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>🏢 {request.startup?.name}</span>
                      <span>📅 {format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                      {request.urgency && (
                        <span className={`px-2 py-1 rounded ${
                          request.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                          request.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {request.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills Tags */}
                {request.skills && request.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {request.skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Matched Mentors */}
                {request.matchedMentors && request.matchedMentors.length > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-sm text-gray-600">Matched Mentors:</span>
                    <div className="flex -space-x-2">
                      {request.matchedMentors.slice(0, 5).map((match) => (
                        <img
                          key={match.mentor._id}
                          src={match.mentor.avatar || 'https://via.placeholder.com/32'}
                          alt={match.mentor.name}
                          className="w-8 h-8 rounded-full border-2 border-white"
                          title={`${match.mentor.name} - ${match.score}% match`}
                        />
                      ))}
                      {request.matchedMentors.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                          +{request.matchedMentors.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sessions */}
                {request.sessions && request.sessions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-700">
                      {request.sessions.length} Session{request.sessions.length !== 1 ? 's' : ''} Scheduled
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && requests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No requests found
            </h3>
            <p className="text-gray-600 mb-6">
              Start by creating a mentorship request
            </p>
            <button
              onClick={() => navigate('/mentor-request')}
              className="btn btn-primary"
            >
              Create Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
