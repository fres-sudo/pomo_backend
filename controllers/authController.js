import User from './../models/userModel.js';
import { promisify } from 'util';
import catchAsync from './../utils/catchAsync.js';
import jwt from 'jsonwebtoken';
import AppError from './../utils/appError.js';
import crypto from 'crypto';
import { Email } from '../utils/email.js';
import otpGenerator from 'otp-generator';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '90d',
  });
};

// ------------------------------ CREATE SEND TOKEN ------------------------------

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
 
  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user
  });
};


// ------------------------------ SIGNUP ---------------------------------

export const signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(user._id);

  createSendToken(newUser, 201, res);
});

// ------------------------------ LOGIN ------------------------------

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // CHECK IF EMAIL AND PASS EXISTS

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //CHECK ID USER EXISTS AND PASS IS CORRECT

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //IF EVERYTHINF IS OK SEND TOKEN TO CLIENT

  const token = signToken(user._id);
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    user,
  });
});

// ------------------------------ PROTECT THE ROUTES ------------------------------

// Middleware function to protect routes
export const protect = async (req, res, next) => {
  try {
    // Getting token from request headers
    let token;
    if (
      req.headers.authorization 
      && req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If token is missing, return 401 Unauthorized
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access',
      });
    }

    // Validate the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token does no longer exist',
      });
    }

    // Check if user changed password after the token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'User recently changed their password. Please log in again',
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    // Log the error for debugging
    console.error('Error in authentication middleware:', error);

    // Return a 500 Internal Server Error response
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};


// ------------------------------ RESTRICT FUNCTION TO CERTAIN USERS ------------------------------

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have the permission to complete this action',
          403
        )
      );
    }
    next();
  };
};

// ------------------------------ FORGOT PASSWORD ------------------------------

export const forgotPassword = catchAsync(async (req, res, next) => {
  
  const body = req.body;
  console.log({body});

  try {
    // Get user based on POSted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with this email address', 404));
    }

    // Generate random reset token
    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });
    
    // Send it to user's email
    const resetOTP = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log({resetOTP});

    // Check if user's email is valid
    if (!user.email) {
      return next(new AppError('User email is not provided.', 400));
    }
    // Create new Email instance
    const emailSender = new Email(user, resetOTP);

    // Send password reset email
    await emailSender.sendPasswordReset();

    console.log(resetOTP,resetToken);

    res.status(200).json({resetOTP, resetToken});
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return next(new AppError('There was an error while sending your email'));
  }
});


// ------------------------------ RESET PASSWORD ------------------------------

export const resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token has not expired, and there is user, set the new password

  if (!user) return next(new AppError('Token is invalid or expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //Update change password at property for the user

  // Log the user in

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

// ------------------------------ UPDATE PASSWORD ------------------------------

export const updatePassword = catchAsync(async (req, res, next) => {
  //Get the user from collection

  const user = await User.findById(req.body.id).select('+password');

  // Check if the POSTed current password is correct

  if (!user.correctPassword(req.body.passwordCurrent, user.password)) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //If so, update password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //Log user in, send JWT

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

