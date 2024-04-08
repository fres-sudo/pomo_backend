import User from './../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from './../utils/catchAsync.js';
import multer from 'multer'
import sharp from "sharp"
import { put, del } from "@vercel/blob"

const multerStorage = multer.memoryStorage();

const kProPicPlaceholderURL = "https://vercel.com/fres-sudos-projects/pomo/stores/blob/store_JJsFgFmzofTAUoN7/browser?file_url=https%253A%252F%252Fjjsfgfmzoftauon7.public.blob.vercel-storage.com%252Fpropic-placeholder-2icvPYX8oI6Q0VbnhmoiSBovWFWzRp.jpg";

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

//export const updateUserPhoto = upload.single('photo');

export const resizeUserPhoto = catchAsync (async (req, res, next) => {
  if(!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  await sharp(req.file.buffer)
  .resize(500, 500)
  .toFormat('jpeg')
  .jpeg({quality : 90})
  .toFile(`public/images/users/${req.file.filename}`);

  next();

});

export const updateUserPhoto = async (req, res) => {
  try {
    const file = req.file;
    console.log({ file });

    // Fetch user data from the database
    const user = await User.findById(req.params.id);

    // Check if the user already has a photo
    if (user.photo) {
      console.log("existing file name", user.photo);

      // Remove the existing photo from storage
      await del(user.photo, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    }

    const filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    const blob = await put(filename, file.buffer, { 
      access: 'public', 
      token: process.env.BLOB_READ_WRITE_TOKEN,  
    });
    
    console.log({ blob });

    // Update the user's photo field in MongoDB
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { photo: blob.url }, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while uploading the file.' });
  }
};


export const updateUser = catchAsync(async (req, res, next) => {
  try {

    const filteredBody = filterObj(req.body, 'name', 'surname');

    const updatedUser = await User.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }
});

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


export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
