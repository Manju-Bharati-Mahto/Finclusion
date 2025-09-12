import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const EmailConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Check if user is now authenticated
        const confirmed = await authService.checkForEmailConfirmation();
        
        if (confirmed) {
          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to dashboard...');
          
          // Add new user flags for dashboard
          sessionStorage.setItem('newUserRegistration', 'true');
          const pendingName = sessionStorage.getItem('pendingUserName');
          if (pendingName) {
            sessionStorage.setItem('registeredName', pendingName);
          }
          
          // Redirect after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Check if user is already logged in
          const isLoggedIn = await authService.isLoggedIn();
          if (isLoggedIn) {
            navigate('/dashboard');
          } else {
            setStatus('error');
            setMessage('Email confirmation failed or expired. Please try registering again.');
          }
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An error occurred during email confirmation. Please try again.');
      }
    };

    confirmEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000]">
      <div className="max-w-md w-full mx-4">
        <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-8 text-center">
          {status === 'confirming' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BF63] mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-white mb-2">Confirming Email</h2>
              <p className="text-[#aaa]">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-[#00BF63] mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Email Confirmed!</h2>
              <p className="text-[#aaa]">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Confirmation Failed</h2>
              <p className="text-[#aaa] mb-4">{message}</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-[#00BF63] text-black px-4 py-2 rounded hover:bg-[#00a755] transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;