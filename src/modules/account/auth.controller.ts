import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logAction } from '../../utils/logAction';
import { registerUser, loginUser, sendVerificationCode, verifyUserEmail, resetPassword, updatePassword } from './auth.service';

interface AuthRequest extends Request {
  user?: {
    id?: string;
    userId?: string;
    email: string;
  };
}

export const passwordReset = async (req: Request, res: Response) => {
  try {
    const { userId, email, newPassword, device } = req.body;
    const identifier = userId || email;

    if (!identifier || !newPassword) {
      return res.status(400).json({ error: 'User identifier (ID or email) and new password are required' });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    await resetPassword(identifier, newPassword);
    await logAction(req, {
      action: "PASSWORD_RESET_SUCCESS",
      module: "AUTH",
      severity: "info",
      description: `password reset success`,
      userId: userId,
      device: device,
    });
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error: any) {
    await logAction(req, {
      action: "PASSWORD_RESET_FAILED",
      module: "AUTH",
      severity: "error",
      description: `attempt to reset password failed`,
      userId: req.body.userId,
      device: req.body.device,
    });
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword, confirmPassword, device } = req.body;
    const userId = req.user?.id || req.user?.userId;

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

    await logAction(req, {
      action: "PASSWORD_UPDATE_SUCCESS",
      module: "AUTH",
      severity: "info",
      description: `password update success`,
      userId: userId,
      device: device,
    });
    await updatePassword(userId, oldPassword, newPassword, confirmPassword);
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    if (error.message === 'New passwords do not match') {
      await logAction(req, {
        action: "PASSWORD_UPDATE_ATTEMPT_FAILED",
        module: "AUTH",
        severity: "warning",
        description: `New passwords do not match`,
        userId: req.body.userId,
        device: req.body.device,
      });
      return res.status(400).json({ error: 'New passwords do not match' });
    }
    if (error.message === 'Current password is incorrect') {
      await logAction(req, {
        action: "PASSWORD_UPDATE_ATTEMPT_FAILED",
        module: "AUTH",
        severity: "warning",
        description: `Current password is incorrect`,
        userId: req.body.userId,
        device: req.body.device,
      });
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    await logAction(req, {
      action: "PASSWORD_UPDATE_FAILED",
      module: "AUTH",
      severity: "error",
      description: error,
      userId: req.body.userId,
      device: req.body.device,
    });
    res.status(500).json({ error: error.message || 'Failed to update password' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password, device } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const result = await loginUser(identifier, password);
    await logAction(req, {
      action: "LOGIN_SUCCESS",
      module: "AUTH",
      severity: "info",
      description: `Login success`,
      userId: req.body.userId,
      device: device,
    });
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      await logAction(req, {
        action: "LOGIN_ATTEMPT_FAILED",
        module: "AUTH",
        severity: "warning",
        description: error,
        userId: req.body.userId,
        device: req.body.device,
      });
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }
    await logAction(req, {
      action: "LOGIN_FAILED",
      module: "AUTH",
      severity: "error",
      description: error,
      userId: req.body.userId,
      device: req.body.device,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendEmailVerification = async (req: Request, res: Response) => {
  try {
    const { email, device } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const code = await sendVerificationCode(email);
    await logAction(req, {
      action: "EMAIL_VERIFICATION_CODE_SENT",
      module: "AUTH",
      severity: "info",
      description: `verification code sent to ${email}`,
      userId: req.body.userId,
      device: device,
    });
    res.status(200).json({ code });
  } catch (error: any) {
    await logAction(req, {
      action: "EMAIL_VERIFICATION_CODE_FAILED",
      module: "AUTH",
      severity: "error",
      description: error,
      userId: req.body.userId,
      device: req.body.device,
    });
    res.status(500).json({ error: error.message || 'Failed to send verification code' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code, sentCode, device } = req.body;

    if (!email || !code || !sentCode) {
      return res.status(400).json({ error: 'Email, code, and sent code are required' });
    }

    await verifyUserEmail(email, code, sentCode);
    await logAction(req, {
      action: "VERIFY_EMAIL_SUCCESS",
      module: "AUTH",
      severity: "info",
      description: email +' verified successfully',
      userId: req.body.userId,
      device: device,
    });
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error: any) {
    if (error.message === 'Invalid verification code') {
      await logAction(req, {
        action: "VERIFY_EMAIL_ATTEMPT_FAILED",
        module: "AUTH",
        severity: "warning",
        description: error,
        userId: req.body.userId,
        device: req.body.device,
      });
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    await logAction(req, {
      action: "VERIFY_EMAIL_FAILED",
      module: "AUTH",
      severity: "error",
      description: error,
      userId: req.body.userId,
      device: req.body.device,
    });
    res.status(500).json({ error: error.message || 'Failed to verify email' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      fname,
      lname,
      username,
      email,
      password,
      contactNumber,
      bdate,
      gender,
      type,
      device
    } = req.body;

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

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
    await logAction(req, {
      action: "REGISTER_SUCCESS",
      module: "AUTH",
      severity: "info",
      description: `New user registered: ${email}`,
      userId: req.body.userId,
      device: device,
    });
    res.status(201).json(userResponse);
  } catch (error: any) {
    if (error.message === 'Email already exists' || error.message === 'Username already exists') {
      await logAction(req, {
        action: "REGISTER_ATTEMPT_FAILED",
        module: "AUTH",
        severity: "warning",
        description: error,
        userId: req.body.userId,
        device: req.body.device,
      });
      return res.status(400).json({ error: error.message });
    }
    await logAction(req, {
      action: "REGISTER_FAILED",
      module: "AUTH",
      severity: "error",
      description: error,
      userId: req.body.userId,
      device: req.body.device,
    });
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

    await logAction(req, {
      action: "ACCESS_TOKEN_REFRESH_SUCCESS",
      module: "AUTH",
      severity: "info",
      description: 'Token refreshed successfully for user:'+ user.email,
      userId: req.body.userId,
    });
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    await logAction(req, {
      action: "ACCESS_TOKEN_REFRESH_FAILED",
      module: "AUTH",
      severity: "error",
      description: error,
      userId: req.body.userId,
    });
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

