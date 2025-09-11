import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProfileEditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: ProfileData) => void;
  isNewUser?: boolean;
}

export interface ProfileData {
  name: string;
  email: string;
  profileImage: string | null;
  dateOfBirth?: string;
  panId?: string;
}

const ProfileEditPopup: React.FC<ProfileEditPopupProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  isNewUser = false
}) => {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    profileImage: null,
    dateOfBirth: '',
    panId: ''
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Load existing profile data if available
  useEffect(() => {
    const savedProfileData = localStorage.getItem('userProfile');
    if (savedProfileData) {
      try {
      const parsedData = JSON.parse(savedProfileData);
      setProfileData(parsedData);
      setImagePreview(parsedData.profileImage);
      } catch (e) {
        console.error("Failed to parse profile data from localStorage", e);
        localStorage.removeItem('userProfile'); // Clear corrupted data
      }
    }
  }, [isOpen]);
  
  // Handle click outside to close (only if not a new user)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) && !isNewUser) {
        onClose();
      }
    };
    
    if (isOpen && !isNewUser) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isNewUser]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setProfileData(prev => ({ ...prev, profileImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleSave = () => {
    console.log('Save button clicked. Is new user?', isNewUser);
    console.log('Current profile data:', profileData);
    
    // Add validation to ensure necessary fields are filled for new users
    if (isNewUser) {
      if (!profileData.name || !profileData.email || !profileData.dateOfBirth || !profileData.panId) {
        alert("Please fill in all required fields");
        console.log('Missing required fields for new user');
        return;
      }
    }
    
    // Always save to localStorage for persistence with the correct key
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    
    // Create currentUser entry if it doesn't exist (for new users)
    // This is necessary for the mock API authentication check
    if (!localStorage.getItem('currentUser')) {
      localStorage.setItem('currentUser', JSON.stringify({
        email: profileData.email,
        name: profileData.name
      }));
    }
    
    // Pass the data to the parent component
    console.log('Calling onSave with data:', profileData);
    onSave(profileData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 popup-container flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <motion.div 
        ref={popupRef} 
        className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto popup-content rounded-lg p-8 shadow-xl bg-[#1a1a1a]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-white">
            {isNewUser ? 'Complete Your Profile' : 'Edit Profile'}
          </h2>
          {!isNewUser && (
            <button 
              onClick={onClose}
              className="text-[#888888] hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center">
            <div 
              className="relative w-28 h-28 rounded-full border-2 border-[#00BF63] flex items-center justify-center mb-4 overflow-hidden bg-[#111] cursor-pointer profile-image-upload group"
              onClick={triggerFileInput}
            >
              {imagePreview ? (
                <>
                  <img 
                    src={imagePreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-14 h-14 text-[#555] group-hover:text-[#00BF63] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="absolute bottom-0 inset-x-0 bg-[#00BF63] bg-opacity-80 py-1.5 text-center text-xs text-black font-medium">
                    Upload Photo
                  </div>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={triggerFileInput}
                className="text-xs bg-[#222] text-white px-3 py-1.5 rounded-md hover:bg-[#333] flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {imagePreview ? 'Change Photo' : 'Upload Photo'}
              </button>
              {imagePreview && (
                <button 
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setProfileData(prev => ({ ...prev, profileImage: null }));
                  }}
                  className="text-xs bg-[#222] text-[#ef4444] px-3 py-1.5 rounded-md hover:bg-[#333] flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              )}
            </div>
            <p className="text-[10px] text-[#666] mt-2 text-center">
              Upload a profile picture to personalize your account
            </p>
          </div>
          
          {/* Profile Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-[#aaa] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                className="form-input text-sm"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="dateOfBirth" className="block text-xs font-medium text-[#aaa] mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={profileData.dateOfBirth || ''}
                onChange={handleInputChange}
                className="form-input text-sm"
                max={new Date().toISOString().split('T')[0]}
                required={isNewUser}
              />
              {isNewUser && (
                <p className="text-[10px] text-[#666] mt-1.5">
                  Your date of birth is required to provide personalized financial advice.
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#aaa] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                className="form-input text-sm"
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <div>
              <label htmlFor="panId" className="block text-xs font-medium text-[#aaa] mb-1.5">
                PAN ID
              </label>
              <input
                type="text"
                id="panId"
                name="panId"
                value={profileData.panId || ''}
                onChange={handleInputChange}
                className="form-input text-sm"
                placeholder="Enter your PAN ID"
                required={isNewUser}
              />
              {isNewUser && (
                <p className="text-[10px] text-[#666] mt-1.5">
                  Your PAN ID is required for financial transactions.
                </p>
              )}
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8">
            {!isNewUser && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#222] text-white text-xs rounded-md hover:bg-[#333]"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-[#00BF63] text-black text-xs font-medium rounded-md hover:bg-[#00a755]"
            >
              {isNewUser ? 'Get Started' : 'Save Changes'}
            </button>
          </div>
          
          {isNewUser && (
            <p className="text-[10px] text-center text-[#666] mt-3">
              Complete your profile to personalize your experience.
              <br />
              You can update these details anytime from your profile settings.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileEditPopup;