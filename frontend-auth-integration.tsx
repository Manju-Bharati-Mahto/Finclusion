// Frontend Integration Guide for Registration & Login
// Complete implementation for React with Supabase authentication

// ==============================================
// 1. SUPABASE CLIENT CONFIGURATION
// ==============================================

// Update your supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// ==============================================
// 2. REGISTRATION COMPONENT
// ==============================================

import React, { useState } from 'react'
import { supabase } from '../services/supabaseClient'

interface RegistrationFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export const Registration: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validate form
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      // Register user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            name: formData.fullName
          }
        }
      })

      if (error) {
        throw error
      }

      if (data.user) {
        setMessage(`Registration successful! Please check your email (${formData.email}) to verify your account before logging in.`)
        
        // Clear form
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
      }

    } catch (error: any) {
      setMessage(`Registration failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
      
      <form onSubmit={handleRegistration} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

// ==============================================
// 3. LOGIN COMPONENT
// ==============================================

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // First check if user can login (email verified)
      const { data: canLogin, error: checkError } = await supabase
        .rpc('can_user_login', { user_email: email })

      if (checkError) {
        throw checkError
      }

      if (!canLogin) {
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.')
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        setMessage('Login successful! Redirecting...')
        
        // Get user profile
        const { data: profile } = await supabase
          .rpc('get_user_profile')
        
        console.log('User profile:', profile)
        
        // Redirect to dashboard or handle successful login
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }

    } catch (error: any) {
      setMessage(`Login failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    try {
      const { error } = await supabase
        .rpc('resend_email_verification', { user_email: email })
      
      if (error) throw error
      
      setMessage('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
          {message.includes('verify your email') && (
            <button
              onClick={handleResendVerification}
              className="ml-2 underline text-blue-600 hover:text-blue-800"
            >
              Resend verification email
            </button>
          )}
        </div>
      )}

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-600">Don't have an account? </span>
        <button 
          onClick={() => window.location.href = '/register'} 
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Sign up here
        </button>
      </div>
    </div>
  )
}

// ==============================================
// 4. EMAIL VERIFICATION HANDLER
// ==============================================

export const EmailVerification: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  React.useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the token from URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const type = urlParams.get('type')

        if (type === 'signup' && token) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) {
            throw error
          }

          setMessage('Email verified successfully! You can now login.')
        } else {
          setMessage('Invalid verification link.')
        }
      } catch (error: any) {
        setMessage(`Verification failed: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    handleEmailVerification()
  }, [])

  if (loading) {
    return <div className="text-center mt-8">Verifying email...</div>
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Email Verification</h2>
      <div className={`p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {message}
      </div>
      {message.includes('successfully') && (
        <button
          onClick={() => window.location.href = '/login'}
          className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      )}
    </div>
  )
}

// ==============================================
// 5. ADMIN DEBUG COMPONENT (OPTIONAL)
// ==============================================

export const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .rpc('admin_get_all_users')
        
        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) return <div>Loading users...</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">All Users (Admin View)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Password Hash</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Email Verified</th>
              <th className="px-4 py-2 text-left">Login Count</th>
              <th className="px-4 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-2">{user.full_name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2 font-mono text-xs">
                  {user.password_hash ? `${user.password_hash.substring(0, 20)}...` : 'N/A'}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.account_status === 'active' ? 'bg-green-100 text-green-800' :
                    user.account_status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.account_status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {user.email_verified ? '✅' : '❌'}
                </td>
                <td className="px-4 py-2">{user.login_count}</td>
                <td className="px-4 py-2">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==============================================
// 6. USAGE NOTES
// ==============================================

/*
IMPLEMENTATION STEPS:

1. Run the comprehensive-database-schema.sql in Supabase SQL Editor
2. Run the supabase-auth-configuration.sql in Supabase SQL Editor
3. Configure Supabase Dashboard:
   - Go to Authentication > Settings
   - Enable "Enable email confirmations" 
   - Set Site URL to: https://manju-bharati-mahto.github.io/FINCLUSION/
   - Customize email templates if needed

4. Install Supabase in your React app:
   npm install @supabase/supabase-js

5. Update your React components with the code above
6. Test the complete flow:
   - Register new user
   - Check email and click verification link
   - Login with verified credentials
   - View user data in admin panel

SECURITY FEATURES IMPLEMENTED:
✅ Password hashing (handled by Supabase)
✅ Email verification required
✅ Account status tracking
✅ Login attempt tracking
✅ Password visibility toggle
✅ Proper error handling
✅ RLS policies for data security
✅ Admin functions for debugging

PASSWORD STORAGE:
- Passwords are HASHED by Supabase (not plain text)
- Hash is stored in user_profiles.password_hash for debugging
- Original password is never stored in plain text
- Only the encrypted hash is visible in the database
*/