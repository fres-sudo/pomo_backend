import User from './../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from './../utils/catchAsync.js';
import multer from 'multer'
import sharp from "sharp"



const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  } else {
    cb(new AppError('Not an Image! Please updload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage, 
  fileFilter : multerFilter,
  });

export const updateUserPhoto = upload.single('photo');

export const resizeUserPhoto = (req, res, next) => {
  if(!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({quality : 90}).toFile(`public/images/users/${req.file.filename}`);

  next();

}
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
    try{

      const filteredBody = filterObj(req.body, 'name' , 'surname');
      if(req.file) filteredBody.photo = req.file.filename;
      
      const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new : true,
        runValidators : true,
      });
    // Fetch the user document
    //const user = await User.findById(req.user.id);

    // If user document is not found, return an error
    //if (!user) {
    //  return next(new AppError('User not found', 404));
    //}
    // Extract only the name and surname from the request body
    //const { name, surname } = req.body;

    console.log(req.file.filename);
  
    
    // Update the user object with the new name and surname
    //user.name = name;
    //user.surname = surname;
    
  
    // Save the updated user object
    //const updatedUser = await user.save();
  
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
