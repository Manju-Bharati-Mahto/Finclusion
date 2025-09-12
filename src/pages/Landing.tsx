import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { authService } from '../services/authService';
import '../styles/Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // Demo credentials
  const demoCredentials = {
    email: 'demo@budgettracker.com',
    password: 'demo1234'
  };

  // Check for email confirmation on component mount
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      const confirmed = await authService.checkForEmailConfirmation();
      if (confirmed) {
        navigate('/dashboard');
      }
    };
    checkEmailConfirmation();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const response = await authService.login(formData.email, formData.password);
        if (response && response.success) {
          // Clear old data for fresh login
          localStorage.removeItem('transactions');
          localStorage.removeItem('customCategories');
          localStorage.removeItem('reminders');
          localStorage.removeItem('monthlyBudget');
          localStorage.removeItem('cartItems');
          localStorage.removeItem('paidRemindersHistory');
          
          // Credentials are automatically saved by authService
          window.dispatchEvent(new CustomEvent('authChange'));
          navigate('/dashboard');
        } else {
          setError(response?.error || 'Login failed: Invalid response from server');
        }
      } else {
        // Handle registration
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('Please fill all fields');
          setLoading(false);
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }
        
        // Call register API
        const response = await authService.register(formData.name, formData.email, formData.password);
        
        if (response && response.success) {
          if (response.needsEmailConfirmation) {
            // Show email confirmation message
            setShowEmailConfirmation(true);
            setError(''); // Clear any existing errors
          } else {
            // Direct login (email confirmation disabled)
            sessionStorage.setItem('newUserRegistration', 'true');
            sessionStorage.setItem('registeredName', formData.name);
            
            // Clear old data for new user
            localStorage.removeItem('transactions');
            localStorage.removeItem('customCategories');
            localStorage.removeItem('reminders');
            localStorage.removeItem('monthlyBudget');
            localStorage.removeItem('cartItems');
            localStorage.removeItem('paidRemindersHistory');
            
            // Credentials are automatically saved by authService
            window.dispatchEvent(new CustomEvent('authChange'));
            navigate('/dashboard');
          }
        } else {
          setError(response?.error || 'Registration failed: Invalid response from server');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Call login API with demo credentials
      const response = await authService.login(demoCredentials.email, demoCredentials.password);
      
      if (response && response.success) {
        // Clear old data for demo login
        localStorage.removeItem('transactions');
        localStorage.removeItem('customCategories');
        localStorage.removeItem('reminders');
        localStorage.removeItem('monthlyBudget');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('paidRemindersHistory');
        
        // Credentials are automatically saved by authService
        window.dispatchEvent(new CustomEvent('authChange'));
        navigate('/dashboard');
      } else {
        setError(response?.error || 'Demo login failed: Invalid response from server');
      }
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError(err.message || 'Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const useDemoCredentials = () => {
    setFormData(prev => ({
      ...prev,
      email: demoCredentials.email,
      password: demoCredentials.password
    }));
    setIsLogin(true);
    setError('');
  };

  const toggleTab = (tab: boolean) => {
    if (tab !== isLogin) {
      setIsLogin(tab);
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark-theme bg-[#000000]">
      <Header 
        isDarkMode={true} 
        profileData={null}
        onEditProfile={() => {}}
        onSignUp={() => toggleTab(false)}
        onBrowseCoursesClick={() => {}}
      />
      <main className="flex-grow flex items-center justify-center p-4 landing-main">
        <div className="landing-container">
          <div className="landing-left">
            <h1>Welcome to BudgetTracker</h1>
            <p>Take control of your finances with our powerful budgeting tool.</p>
            <div className="features-container">
              <section className="feature">
                <div className="feature-icon">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="feature-title">Track</h3>
              </section>
              <section className="feature">
                <div className="feature-icon">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="feature-title">Chart</h3>
              </section>
              <section className="feature">
                <div className="feature-icon">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="feature-title">Budget</h3>
              </section>
              <section className="feature">
                <div className="feature-icon">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="feature-title">Grow</h3>
              </section>
            </div>
          </div>
          
          <div className="landing-right">
            <div className="auth-container">
              <div className="auth-tabs">
                <button 
                  className={`auth-tab ${isLogin ? 'active' : ''}`} 
                  onClick={() => toggleTab(true)}
                >
                  Log In
                </button>
                <button 
                  className={`auth-tab ${!isLogin ? 'active' : ''}`} 
                  onClick={() => toggleTab(false)}
                >
                  Register
                </button>
              </div>
              
              {error && <div className="auth-error">{error}</div>}
              
              {showEmailConfirmation && (
                <div className="email-confirmation-message" style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #00BF63',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ color: '#00BF63', marginBottom: '8px', fontSize: '16px' }}>
                    Check Your Email
                  </h3>
                  <p style={{ color: '#ffffff', fontSize: '14px', marginBottom: '12px' }}>
                    We've sent a confirmation link to <strong>{formData.email}</strong>
                  </p>
                  <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '16px' }}>
                    Click the link in the email to verify your account and you'll be automatically redirected to your dashboard.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                      onClick={async () => {
                        try {
                          const result = await authService.resendConfirmation(formData.email);
                          if (result.success) {
                            setError('Confirmation email sent successfully!');
                            setTimeout(() => setError(''), 3000);
                          } else {
                            setError(result.error || 'Failed to resend email');
                          }
                        } catch (err: any) {
                          setError(err.message || 'Failed to resend email');
                        }
                      }}
                      style={{
                        backgroundColor: '#00BF63',
                        color: '#000',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Resend Email
                    </button>
                    <button 
                      onClick={() => {
                        setShowEmailConfirmation(false);
                        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#aaa',
                        border: '1px solid #333',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Try Different Email
                    </button>
                  </div>
                </div>
              )}
              
              <div className="auth-form-container">
                <form onSubmit={handleSubmit}>
                  {!isLogin && (
                    <div className="form-group">
                      <label htmlFor="name">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                      />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                    />
                  </div>
                  
                  {!isLogin && (
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                      />
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    className="auth-button"
                    disabled={loading}
                  >
                    {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Create Account')}
                  </button>
                </form>

                <div className="demo-access">
                  <p className="demo-text">For quick access:</p>
                  <div className="demo-credentials">
                    <div>
                      <span className="credential-label">Email:</span>
                      <span className="credential-value">{demoCredentials.email}</span>
                    </div>
                    <div>
                      <span className="credential-label">Password:</span>
                      <span className="credential-value">{demoCredentials.password}</span>
                    </div>
                  </div>
                  <div className="demo-buttons">
                    <button 
                      onClick={useDemoCredentials} 
                      className="demo-fill-button"
                      disabled={loading}
                    >
                      Fill Credentials
                    </button>
                    <button 
                      onClick={handleDemoLogin} 
                      className="demo-login-button"
                      disabled={loading}
                    >
                      {loading ? 'Please wait...' : 'Quick Demo Login'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer isDarkMode={true} profileData={null} />
    </div>
  );
};

export default Landing; 