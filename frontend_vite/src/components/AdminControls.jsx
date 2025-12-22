import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

/**
 * AdminControls Component
 * Bulk action controls for admin users
 */
const AdminControls = ({
  selectedCount,
  selectedStartups,
  onActionComplete,
  onSelectAll,
  allSelected,
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const actions = [
    { id: 'approve', label: 'Approve', icon: '✅', color: 'green' },
    { id: 'activate', label: 'Activate', icon: '🚀', color: 'blue' },
    { id: 'reject', label: 'Reject', icon: '❌', color: 'red' },
    { id: 'flag', label: 'Flag for Review', icon: '🚩', color: 'yellow' },
  ];

  const handleAction = (actionId) => {
    setPendingAction(actionId);
    setShowConfirm(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    setLoading(true);
    try {
      const response = await api.put('/dashboard/bulk-action', {
        action: pendingAction,
        startupIds: selectedStartups,
      });

      toast.success(response.data.message);
      onActionComplete();
      setShowConfirm(false);
      setPendingAction(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Bulk action failed';
      toast.error(errorMsg);
      console.error('Bulk action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAction = () => {
    setShowConfirm(false);
    setPendingAction(null);
  };

  return (
    <>
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onSelectAll}
              className="text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              {allSelected ? '☑️ Deselect All' : '☐ Select All'}
            </button>
            <span className="text-sm font-medium text-primary-900">
              {selectedCount} startup{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${
                  action.color === 'green'
                    ? 'bg-green-600 hover:bg-green-700'
                    : action.color === 'blue'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : action.color === 'red'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Bulk Action
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to{' '}
              <strong>
                {actions.find((a) => a.id === pendingAction)?.label.toLowerCase()}
              </strong>{' '}
              {selectedCount} startup{selectedCount !== 1 ? 's' : ''}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelAction}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminControls;
