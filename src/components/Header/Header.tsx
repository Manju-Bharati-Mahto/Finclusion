import React, { useState, useRef, useEffect } from 'react';
import { ProfileData } from '../ProfileEditPopup';

interface HeaderProps {
  isDarkMode: boolean;
  profileData: ProfileData | null;
  onEditProfile: () => void;
  onSignUp?: () => void;
  onBrowseCoursesClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, profileData, onEditProfile, onSignUp, onBrowseCoursesClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current && 
        !profileMenuRef.current.contains(event.target as Node) && 
        !(event.target as Element).closest('.profile-avatar-button') 
      ) {
        setIsProfileOpen(false);
      }
      
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) && 
        !(event.target as Element).closest('button[data-popup-toggle]')
      ) {
        setActivePopup(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle popup function
  const togglePopup = (popupName: string) => {
    if (activePopup === popupName) {
      setActivePopup(null);
    } else {
      setActivePopup(popupName);
      setIsProfileOpen(false);
    }
  };

  // Close all popups
  const closeAllPopups = () => {
    setActivePopup(null);
    setIsProfileOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
    setActivePopup(null);
  };
  
  const handleUpdateProfileClick = () => {
    onEditProfile();
    setIsProfileOpen(false);
  };

  const handleSignOut = () => {
    console.log("Sign Out clicked");
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('transactions');
    localStorage.removeItem('customCategories');
    localStorage.removeItem('reminders');
    localStorage.removeItem('monthlyBudget');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('paidRemindersHistory');
    localStorage.removeItem('profileData'); // Clear old key
    
    setIsProfileOpen(false);
    window.dispatchEvent(new CustomEvent('authChange'));
    window.location.href = '/'; // Redirect to landing page
  };

  const logoHref = profileData?.name ? '/dashboard' : '/';

  return (
    <header className={`shadow-sm px-4 py-2 ${isDarkMode ? 'header-footer-bg' : 'bg-white'}`}>
      <div className="w-full h-[60px] flex items-center justify-between">
        {/* Logo */}
        <a href={logoHref} className="text-4xl font-bold text-[#00BF63] font-league lowercase no-underline">
          finclusion.
        </a>

        {/* Navigation */}
        <div className="flex items-center justify-between space-x-6">
          {/* Navigation */}
          <div className="flex items-center space-x-10 text-sm">
            <button 
              onClick={() => togglePopup('home')} 
              data-popup-toggle="home"
              className={`nav-button text-base font-medium ${activePopup === 'home' ? 'active' : 'text-white'}`}
            >
              Home
            </button>
            <button 
              onClick={() => togglePopup('expense')} 
              data-popup-toggle="expense"
              className={`nav-button text-base font-medium ${activePopup === 'expense' ? 'active' : 'text-white'}`}
            >
              Expense
            </button>
            <button 
              onClick={() => {
                onBrowseCoursesClick();
                closeAllPopups();
              }}
              className={`nav-button text-base font-medium text-white`}
            >
              Courses
            </button>
            <button 
              onClick={() => togglePopup('services')} 
              data-popup-toggle="services"
              className={`nav-button text-base font-medium ${activePopup === 'services' ? 'active' : 'text-white'}`}
            >
              Services
            </button>
            <button 
              onClick={() => togglePopup('aboutUs')} 
              data-popup-toggle="aboutUs"
              className={`nav-button text-base font-medium ${activePopup === 'aboutUs' ? 'active' : 'text-white'}`}
            >
              About Us
            </button>
          </div>
  
          {/* Profile Menu */}
          <div className="relative flex items-center space-x-4 z-10">
            {!profileData?.name && onSignUp && (
              <button
                onClick={onSignUp}
                className="px-4 py-2 bg-[#00BF63] text-black text-sm font-medium rounded hover:bg-[#00a755]"
              >
                Sign Up
              </button>
            )}
            {profileData?.name && (
            <div className="relative">
              <div className="relative">
                <button 
                  onClick={handleProfileClick}
                  className={`profile-avatar-button flex items-center justify-center w-10 h-10 rounded-full overflow-hidden profile-icon ${profileData && profileData.profileImage ? 'has-image' : 'bg-[#00BF63]'}`}
                >
                  {profileData && profileData.profileImage ? (
                    <img 
                      src={profileData.profileImage} 
                      alt={profileData.name || "User"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </button>
                
                {/* REMOVED Edit profile icon overlay - functionality moved to dropdown */}
              </div>
              
              {isProfileOpen && (
                <div ref={profileMenuRef} className="absolute right-0 top-full mt-2 w-56 profile-menu rounded-md shadow-lg py-1.5 z-50 origin-top-right">
                  {profileData && profileData.name && (
                    <div className="px-4 py-2.5 border-b border-[#333]">
                      <p className="text-sm font-medium text-white">{profileData.name}</p>
                      {profileData.email && <p className="text-xs text-[#aaa] truncate">{profileData.email}</p> }
                      {profileData.dateOfBirth && (
                        <p className="text-xs text-[#aaa] mt-1">DOB: {new Date(profileData.dateOfBirth).toLocaleDateString()}</p>
                      )}
                      {profileData.panId && (
                        <p className="text-xs text-[#00BF63] mt-1">PAN ID: {profileData.panId}</p>
                      )}
                    </div>
                  )}
                  <button 
                    onClick={handleUpdateProfileClick} 
                    className="w-full text-left block px-4 py-2.5 text-sm text-[#aaa] hover:bg-[#222] hover:text-white"
                  >
                    Update Profile
                  </button>
                  <a href="#settings" className="block px-4 py-2.5 text-sm text-[#aaa] hover:bg-[#222] hover:text-white">
                    Settings
                  </a>
                  <a href="#help" className="block px-4 py-2.5 text-sm text-[#aaa] hover:bg-[#222] hover:text-white">
                    Help
                  </a>
                  <div className="border-t border-[#333] my-1"></div>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left block px-4 py-2.5 text-sm text-[#f87171] hover:bg-[#222]"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Popups for navigation items */}
      {activePopup && (
        <div className="fixed inset-0 popup-container flex items-center justify-center z-50">
          <div ref={popupRef} className="w-[700px] max-h-[80vh] overflow-auto popup-content rounded-lg p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {activePopup === 'home' && "Welcome to Finclusion"}
                {activePopup === 'expense' && "Expense Management"}
                {activePopup === 'courses' && "Financial Literacy Courses"}
                {activePopup === 'services' && "Our Services"}
                {activePopup === 'aboutUs' && "About Finclusion"}
              </h2>
              <button 
                onClick={() => setActivePopup(null)}
                className="text-[#888888] hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Home Popup Content */}
            {activePopup === 'home' && (
              <div className="space-y-6 text-[#aaa]">
                <p className="text-lg">
                  Welcome to Finclusion, your personal finance management solution! Track your expenses, manage your budget, and achieve your financial goals.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#00BF63] flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-white font-bold">Dashboard</h3>
                    </div>
                    <p>View your financial overview at a glance with our intuitive dashboard.</p>
                  </div>
                  
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#00BF63] flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-white font-bold">Budget Planning</h3>
                    </div>
                    <p>Set and track your budget to reach your financial goals.</p>
                  </div>
                  
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#00BF63] flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h3 className="text-white font-bold">Insights & Analytics</h3>
                    </div>
                    <p>Gain powerful insights into your spending habits and patterns.</p>
                  </div>
                  
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#00BF63] flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-white font-bold">Reminders</h3>
                    </div>
                    <p>Never miss a payment with our smart reminder system.</p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={closeAllPopups}
                    className="bg-[#00BF63] text-black px-4 py-2 rounded font-medium hover:bg-[#00a755]"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}
            
            {/* Expense Popup Content */}
            {activePopup === 'expense' && (
              <div className="space-y-4 text-[#aaa]">
                <p>
                  Track and manage your expenses efficiently with our powerful tools. Categorize your 
                  transactions, set budgets, and visualize your spending patterns.
                </p>
                
                <div className="bg-[#111] rounded-lg p-4 mt-4 border border-[#333]">
                  <h3 className="text-xl font-bold text-white mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-[#00BF63] mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Real-time expense tracking with custom categories</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-[#00BF63] mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Advanced analytics and reports with visual charts</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-[#00BF63] mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Monthly spending insights and budget comparison</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-[#00BF63] mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Custom alerts for unusual spending patterns</span>
                    </li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <h4 className="text-white font-bold mb-2">Expense Tracking</h4>
                    <p className="text-sm">Add, edit, and categorize your expenses with our intuitive interface.</p>
                  </div>
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <h4 className="text-white font-bold mb-2">Budget Management</h4>
                    <p className="text-sm">Set monthly budgets and track your progress throughout the month.</p>
                  </div>
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <h4 className="text-white font-bold mb-2">Category Analysis</h4>
                    <p className="text-sm">Understand where your money goes with detailed category breakdowns.</p>
                  </div>
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <h4 className="text-white font-bold mb-2">Trend Monitoring</h4>
                    <p className="text-sm">Track spending trends over time to identify areas for improvement.</p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={closeAllPopups}
                    className="bg-[#00BF63] text-black px-4 py-2 rounded font-medium hover:bg-[#00a755]"
                  >
                    Manage Expenses
                  </button>
                </div>
              </div>
            )}
            
            {/* Courses Popup Content - This will no longer be triggered by the "Courses" nav button directly */}
            {activePopup === 'courses' && (
              <div className="space-y-4 text-[#aaa]">
                <p>
                  Enhance your financial knowledge with our curated selection of courses designed 
                  to help you make better financial decisions.
                </p>
                
                <div className="space-y-4 mt-4">
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333] flex justify-between">
                    <div>
                      <h3 className="text-white font-bold">Introduction to Personal Finance</h3>
                      <p className="text-sm mt-1">Learn the basics of budgeting, saving, and investing</p>
                      <div className="flex items-center mt-2">
                        <span className="text-[#00BF63] font-medium">₹599</span>
                        <span className="mx-2 text-[#666]">•</span>
                        <span className="text-xs flex items-center">
                          <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          4.8 (126 reviews)
                        </span>
                      </div>
                    </div>
                    <button className="bg-[#00BF63] text-black px-3 py-1.5 rounded text-sm font-medium self-center">
                      Add to Cart
                    </button>
                  </div>
                  
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333] flex justify-between">
                    <div>
                      <h3 className="text-white font-bold">Investment Strategies for Beginners</h3>
                      <p className="text-sm mt-1">Understanding stocks, bonds, and mutual funds</p>
                      <div className="flex items-center mt-2">
                        <span className="text-[#00BF63] font-medium">₹799</span>
                        <span className="mx-2 text-[#666]">•</span>
                        <span className="text-xs flex items-center">
                          <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          4.9 (98 reviews)
                        </span>
                      </div>
                    </div>
                    <button className="bg-[#00BF63] text-black px-3 py-1.5 rounded text-sm font-medium self-center">
                      Add to Cart
                    </button>
                  </div>
                  
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333] flex justify-between">
                    <div>
                      <h3 className="text-white font-bold">Retirement Planning Essentials</h3>
                      <p className="text-sm mt-1">Plan for a secure and comfortable retirement</p>
                      <div className="flex items-center mt-2">
                        <span className="text-[#00BF63] font-medium">₹899</span>
                        <span className="mx-2 text-[#666]">•</span>
                        <span className="text-xs flex items-center">
                          <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          4.7 (84 reviews)
                        </span>
                      </div>
                    </div>
                    <button className="bg-[#00BF63] text-black px-3 py-1.5 rounded text-sm font-medium self-center">
                      Add to Cart
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={() => {
                        onBrowseCoursesClick(); 
                        closeAllPopups();
                    }}
                    className="bg-[#00BF63] text-black px-4 py-2 rounded font-medium hover:bg-[#00a755]"
                  >
                    Browse All Courses
                  </button>
                </div>
              </div>
            )}
            
            {/* Services Popup Content */}
            {activePopup === 'services' && (
              <div className="space-y-4 text-[#aaa]">
                <p>
                  Our comprehensive suite of financial services is designed to help you achieve financial 
                  wellness through informed decisions and personalized guidance.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#00BF63] flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-white font-bold">Financial Planning</h3>
                    </div>
                    <p>Comprehensive planning tailored to your specific financial goals and life stage.</p>
                    <button className="mt-3 text-[#00BF63] text-sm font-medium flex items-center">
                      Learn More
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#00BF63] flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-white font-bold">Investment Advisory</h3>
                    </div>
                    <p>Expert guidance on investment strategies to maximize returns and minimize risk.</p>
                    <button className="mt-3 text-[#00BF63] text-sm font-medium flex items-center">
                      Learn More
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#00BF63] flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-white font-bold">Insurance Planning</h3>
                    </div>
                    <p>Protect your assets and loved ones with appropriate insurance coverage.</p>
                    <button className="mt-3 text-[#00BF63] text-sm font-medium flex items-center">
                      Learn More
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#00BF63] flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                      </div>
                      <h3 className="text-white font-bold">Tax Planning</h3>
                    </div>
                    <p>Optimize your tax strategy to minimize liabilities and maximize savings.</p>
                    <button className="mt-3 text-[#00BF63] text-sm font-medium flex items-center">
                      Learn More
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#111] p-4 rounded-lg border border-[#222] mt-4">
                  <h3 className="text-white font-bold mb-2">Schedule a Consultation</h3>
                  <p className="text-sm mb-3">Speak with our financial experts to discuss your financial goals and challenges.</p>
                  <div className="flex justify-end">
                    <button className="bg-[#00BF63] text-black px-3 py-1.5 rounded text-sm font-medium">
                      Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* About Us Popup Content */}
            {activePopup === 'aboutUs' && (
              <div className="space-y-4 text-[#888888]">
                <p>
                  Finclusion was founded in 2024 with a vision to revolutionize personal finance management. 
                  Our journey began when we recognized the need for a more intuitive and user-friendly way 
                  to track and manage personal finances.
                </p>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Our Mission</h3>
                  <p>
                    To empower individuals with the tools and insights they need to make informed financial 
                    decisions and achieve their financial goals.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Features We Provide</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Real-time transaction tracking and categorization</li>
                    <li>Intuitive expense and income management</li>
                    <li>Visual representation of spending patterns</li>
                    <li>Secure data management and privacy protection</li>
                    <li>Customizable categories and tags</li>
                    <li>Easy-to-use interface with dark mode support</li>
                    <li>Transaction history with search and filter capabilities</li>
                    <li>Responsive design for all devices</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Our Commitment</h3>
                  <p>
                    We are committed to continuously improving our platform and adding new features based on 
                    user feedback. Our goal is to make personal finance management accessible, efficient, and 
                    enjoyable for everyone.
                  </p>
                </div>
                <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                  <h3 className="text-xl font-bold text-white mb-2">Contact Us</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-white font-medium mb-1">Email</h4>
                      <p className="text-[#00BF63]">support@finclusion.com</p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Phone</h4>
                      <p className="text-[#00BF63]">+91 98765 43210</p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Address</h4>
                      <p>123 Finance Street, Bengaluru, Karnataka, India</p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Hours</h4>
                      <p>Monday-Friday: 9am-6pm IST</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 