import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MFASetup from '../components/MFA/MFASetup';

const MFASetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // Redirect if user is not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <MFASetup 
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
};

export default MFASetupPage;