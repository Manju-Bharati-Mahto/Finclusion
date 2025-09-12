import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import App from '../App';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userSessionKey, setUserSessionKey] = useState<string>(Date.now().toString());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        // First check for email confirmation
        const confirmed = await authService.checkForEmailConfirmation();
        if (confirmed) {
          console.log('✅ Email confirmed, user authenticated via email link');
        }
        
        // Check if user is logged in
        const isLoggedIn = await authService.isLoggedIn();
        if (!isLoggedIn) {
          console.log('❌ User not authenticated, redirecting to landing');
          navigate('/');
          return;
        }
        
        console.log('✅ User is authenticated, loading dashboard');
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/');
      }
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const updateUserKey = () => {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          // Use a unique part of user data if available, otherwise a timestamp
          setUserSessionKey(userData.id || userData.email || Date.now().toString());
        } catch (e) {
          setUserSessionKey(Date.now().toString()); // Fallback to timestamp
        }
      } else {
        setUserSessionKey(Date.now().toString()); // Key for logged-out or pre-login state
      }
    };

    // Initial key set
    updateUserKey();

    // Listen for custom 'authChange' event
    window.addEventListener('authChange', updateUserKey);

    // Optional: Listen for general storage changes as a fallback
    // window.addEventListener('storage', updateUserKey);

    return () => {
      window.removeEventListener('authChange', updateUserKey);
      // window.removeEventListener('storage', updateUserKey);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BF63] mx-auto mb-4"></div>
          <p className="text-white">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return <App key={userSessionKey} />;
};

export default Dashboard; 