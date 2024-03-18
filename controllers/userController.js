import User from './../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from './../utils/catchAsync.js';

const filterObj = (obj, ...allowFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    resutls: users.length,
    data: {
      users,
    },
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  //  Create error if user POSTs password data
  //if (req.body.password || req.body.passwordConfirm) {
  //  return next(
  //    new AppError(
  //      'This route is not for password updates. Please use /updateMyPassword.',
  //      400,
  //    ),
  //  );
 // }

  //  Filtered out unwanted fields names that are not allowed to be updated
  //const filteredBody = filterObj(req.body, 'username', 'email');

  //  Update user document
  //const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
  //  new: true,
  //  runValidators: true,
  //});

    try{
      // Fetch the user document
    const user = await User.findById(req.user.id);

    // If user document is not found, return an error
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    // Extract only the name and surname from the request body
    const { name, surname } = req.body;
  
    // Update the user object with the new name and surname
    user.name = name;
    user.surname = surname;
  
    // Save the updated user object
    const updatedUser = await user.save();
  
    res.status(200).json(updatedUser);

} catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
