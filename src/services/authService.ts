import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User, { IUser } from '../models/userModel';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate random 6-digit code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

interface RegisterUserData {
  fname: string;
  lname?: string;
  username: string;
  email: string;
  password: string;
  contactNumber?: string;
  bdate: Date;
  gender: string;
  type: string;
}

interface LoginResponse {
  user: Omit<IUser, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export const loginUser = async (identifier: string, password: string): Promise<LoginResponse> => {
  try {
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const secretKey = process.env.JWT_SECRET || 'default_secret';
    const userId = (user._id as any).toString();
    const accessToken = jwt.sign(
      { id: userId, userId: userId, email: user.email },
      secretKey,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { id: userId, userId: userId },
      secretKey,
      { expiresIn: '7d' }
    );

    const userObject = user.toObject();

    return {
      user: userObject,
      accessToken,
      refreshToken
    };
  } catch (error) {
    throw error;
  }
};

export const sendVerificationCode = async (email: string): Promise<string> => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    const code = generateVerificationCode();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'TaraG Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
          <p>Please use the following code to verify your email address:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 10px;">${code}</h1>
          <p>This code will expire in 30 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return code;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const verifyUserEmail = async (email: string, code: string, sentCode: string): Promise<void> => {
  try {
    // Verify the code first
    if (code !== sentCode) {
      throw new Error('Invalid verification code');
    }

    // Find and update user status
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Update status to active
    user.status = 'active';
    await user.save();
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

export const registerUser = async (userData: RegisterUserData): Promise<IUser> => {
  try {
    const existingEmail = await User.findOne({ email: userData.email });
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    const existingUsername = await User.findOne({ username: userData.username });
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = new User({
      ...userData,
      password: hashedPassword,
      visibilitySettings: {
        isProfilePublic: true,
        isPersonalInfoPublic: true,
        isTravelInfoPublic: true,
      },
      securitySettings: {
        is2FAEnabled: false
      },
      safetyState: {
        isInAnEmergency: false,
        emergencyType: ""
      },
      profileImage: "",
    });

    await user.save();
    return user;
  } catch (error) {
    throw error;
  }
};


export const resetPassword = async (identifier: string, newPassword: string): Promise<void> => {
  try {
    if (!identifier || !newPassword) {
      throw new Error('Identifier and new password are required');
    }

    let user;
    if (identifier.includes('@')) {
      // If identifier is an email
      user = await User.findOne({ email: identifier });
    } else {
      // If identifier is a userId
      user = await User.findById(identifier);
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (
  userId: string, 
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> => {
  try {
    // Verify passwords match
    if (newPassword !== confirmPassword) {
      throw new Error('New passwords do not match');
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
  } catch (error) {
    throw error;
  }
};