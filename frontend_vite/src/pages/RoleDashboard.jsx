import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import AdminStartups from './AdminStartups';
import FounderDashboard from './FounderDashboard';
import MentorDashboard from './MentorDashboard';
import InvestorDashboard from './InvestorDashboard';

/**
 * Role-Based Dashboard Router
 * Automatically routes users to their role-specific dashboard
 */
const RoleDashboard = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="spinner"></div>
      </div>
    );
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case 'admin':
      return <AdminStartups />;
    case 'founder':
      return <FounderDashboard />;
    case 'mentor':
      return <MentorDashboard />;
    case 'investor':
      return <InvestorDashboard />;
    default:
      return <FounderDashboard />; // Default fallback
  }
};

export default RoleDashboard;
