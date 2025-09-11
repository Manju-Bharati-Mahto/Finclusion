import React, { useEffect, useState } from 'react';
import App from '../App';

const Dashboard: React.FC = () => {
  const [userSessionKey, setUserSessionKey] = useState<string>(Date.now().toString());

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

  return <App key={userSessionKey} />;
};

export default Dashboard; 