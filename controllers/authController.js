import User from './../models/userModel.js';
import { promisify } from 'util';
import catchAsync from './../utils/catchAsync.js';
import jwt from 'jsonwebtoken';
import AppError from './../utils/appError.js';
import crypto from 'crypto';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '90d',
  });
};

// --- SIGNUP ---

export const signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    token,
    user,
  });
});

// --- LOGIN ---

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

// --- PROTECT THE ROUTES ---

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


// --- RESTRICT FUNCTION TO CERTAIN USERS ---

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

// --- FORGOT PASSWORD ---

export const forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // Generate random reset token

  const resetToken = User.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // Send it to user's email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a request with your new password and confirm password to: ${resetURL}. \nIf you didn't forgot your password please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error while sending your email'));
  }
});

// --- RESET PASSWORD ---

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

  //Update changeéassword at property for the user

  // Log the user in

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

// --- UPDATE PASSWORD ---

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
