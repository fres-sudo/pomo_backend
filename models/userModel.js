import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs/dist/bcrypt.js';
import crypto from 'crypto';
import otpGenerator from "otp-generator";
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: [true, 'Please provide an username'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  name: {
    type: String
  },
  surname: {
    type: String,
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    requided: [true, 'Please confirm your password'],
    //validate: {
    //  //This only works on CREATE and SAVE
    //  validator: {
    //    validator: function (e) {
    //      return e === this.password;
    //    },
    //    message: "Passwords are not the same",
    //  },
    //},
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  //only runs if pass is actually modified
  if (!this.isModified('password')) return next();
  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // -1000 for database delay
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  // Initialize changeTimeStamp
  let changeTimeStamp = 0;

  if (this.passwordChangedAt) {
    // User has changed the password at least once
    changeTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
  }

  // Check if user changed their password after the token was issued
  return JWTTimestamp < changeTimeStamp;
};

//-------------    GENERATE TOKEN FOR THE USER ------------------

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  //const otp = otpGenerator.generate(6, {
  //  upperCaseAlphabets: false,
  //  lowerCaseAlphabets: false,
  //  specialChars: false,
  //});

  //to store the token but crypted
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // to set a reset password expire date (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  //return the token, that should be send via email
  return resetToken;
};




const User = mongoose.model('User', userSchema);

export default User;
