import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { registerUser, loginUser, sendVerificationCode, verifyUserEmail, resetPassword, updatePassword } from '../services/authService';

interface AuthRequest extends Request {
  user?: {
    id?: string;
    userId?: string;
    email: string;
  };
}

export const passwordReset = async (req: Request, res: Response) => {
  try {
    const { userId, email, newPassword } = req.body;
    const identifier = userId || email;

    if (!identifier || !newPassword) {
      return res.status(400).json({ error: 'User identifier (ID or email) and new password are required' });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    await resetPassword(identifier, newPassword);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?.id || req.user?.userId;

    console.log('🟡 changePassword - req.user:', req.user);
    console.log('🟡 changePassword - userId extracted:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    await updatePassword(userId, oldPassword, newPassword, confirmPassword);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    if (error.message === 'New passwords do not match') {
      return res.status(400).json({ error: 'New passwords do not match' });
    }
    if (error.message === 'Current password is incorrect') {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    console.error('Password update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update password' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const result = await loginUser(identifier, password);
    console.log('✅ Login successful for user:', result.user.email);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendEmailVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const code = await sendVerificationCode(email);
    res.status(200).json({ code });
  } catch (error: any) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: error.message || 'Failed to send verification code' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code, sentCode } = req.body;

    if (!email || !code || !sentCode) {
      return res.status(400).json({ error: 'Email, code, and sent code are required' });
    }

    await verifyUserEmail(email, code, sentCode);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error: any) {
    if (error.message === 'Invalid verification code') {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    console.error('Email verification error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify email' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Received registration request body:', req.body);
    
    const {
      fname,
      lname,
      username,
      email,
      password,
      contactNumber,
      bdate,
      gender,
      type
    } = req.body;

    // Log individual field values
    console.log('Validation check values:', {
      fname: !!fname,
      username: !!username,
      email: !!email,
      password: !!password,
      bdate: !!bdate,
      gender: !!gender,
      type: !!type
    });

    // Basic validation
    if (!fname || !username || !email || !password || !bdate || !gender || !type) {
      const missingFields = [];
      if (!fname) missingFields.push('fname');
      if (!username) missingFields.push('username');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!bdate) missingFields.push('bdate');
      if (!gender) missingFields.push('gender');
      if (!type) missingFields.push('type');
      
      return res.status(400).json({ 
        error: 'All required fields must be filled',
        missingFields 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await registerUser({
      fname,
      lname,
      username,
      email,
      password,
      contactNumber,
      bdate: new Date(bdate),
      gender,
      type
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error: any) {
    if (error.message === 'Email already exists' || error.message === 'Username already exists') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const secretKey = process.env.JWT_SECRET || 'default_secret';

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, secretKey);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh token expired, please login again' });
      }
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Find user to ensure they still exist
    const User_model = require('../models/userModel').default;
    const user = await User_model.findById(decoded.id || decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new tokens with proper expiration
    const newAccessToken = jwt.sign(
      { id: user._id.toString(), userId: user._id.toString(), email: user.email },
      secretKey,
      { expiresIn: '1h' } // 1 hour
    );

    const newRefreshToken = jwt.sign(
      { id: user._id.toString(), userId: user._id.toString() },
      secretKey,
      { expiresIn: '14d' } // 14 days
    );

    console.log('✅ Token refreshed successfully for user:', user.email);
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

