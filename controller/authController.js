import User from '../model/User.js';
import { BadRequestError, UnauthenticatedError } from '../errors/index.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// @desc    Register user & Send OTP
// @route   POST /api/v1/auth/register
const register = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  if (!name || !email || !password || !phoneNumber) {
    throw new BadRequestError('Please provide all values');
  }

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new BadRequestError('Email already in use');
  }

  const phoneAlreadyExists = await User.findOne({ phoneNumber });
  if (phoneAlreadyExists) {
    throw new BadRequestError('Phone number already in use');
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Set Expiry to 10 minutes from now
  const tenMinutes = 1000 * 60 * 10;
  const verificationTokenExpires = new Date(Date.now() + tenMinutes);

  const user = await User.create({
    name,
    email,
    password,
    phoneNumber,
    verificationToken: otp,
    verificationTokenExpires,
    isVerified: false,
  });

  // Send Email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Family Connect - Verification Code',
      html: `
        <h4>Hello ${user.name},</h4>
        <p>Your verification code is: <b style="font-size: 24px;">${otp}</b></p>
        <p>This code expires in 10 minutes.</p>
      `,
    });
  } catch (error) {
    // If email fails, we should probably delete the user or handle gracefully
    console.error('Email send failed:', error);
    // For now, we allow the user creation but they will need to request a new OTP later
  }

  res.status(201).json({
    msg: 'Success! Please check your email for the verification code.',
    email: user.email,
  });
};

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-email
const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new BadRequestError('Please provide email and OTP');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError('Verification Failed');
  }

  // Check if verified already
  if (user.isVerified) {
    return res.status(200).json({ msg: 'Email already verified, please login' });
  }

  // Check OTP Match
  if (user.verificationToken !== otp) {
    throw new UnauthenticatedError('Invalid verification code');
  }

  // Check Expiry
  const now = new Date();
  if (user.verificationTokenExpires < now) {
    throw new UnauthenticatedError('Verification code expired');
  }

  // Success: Update User
  user.isVerified = true;
  user.verificationToken = '';
  user.verificationTokenExpires = null;
  await user.save();

  // Create Token immediately so they don't have to login again
  const token = user.createJWT();

  res.status(200).json({
    msg: 'Email Verified Successfully',
    user: {
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      familyId: user.familyId,
    },
    token,
  });
};

// @desc    Login user
// @route   POST /api/v1/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide all values');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  // --- NEW CHECK: IS VERIFIED? ---
  if (!user.isVerified) {
    throw new UnauthenticatedError('Please verify your email first');
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const token = user.createJWT();
  user.password = undefined;

  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      familyId: user.familyId,
      avatar: user.avatar,
    },
    token,
  });
};

// @desc    Get current user info
// @route   GET /api/v1/auth/me
const getUser = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId });
  if(!user) {
      throw new UnauthenticatedError('User not found');
  }
  res.status(200).json({ 
    user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        familyId: user.familyId,
        avatar: user.avatar
    } 
  });
};

export { register, verifyEmail, login, getUser };