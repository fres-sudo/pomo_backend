import User from './../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from './../utils/catchAsync.js';
import multer from 'multer'
import sharp from "sharp"
import { put } from "@vercel/blob"

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

 export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    console.log({file});
    const blob = await put(file.originalname, file.buffer, { access: 'public' , token : process.env.BLOB_READ_WRITE_TOKEN,  });
    console.log({blob});
    res.json({blob});
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while uploading the file.' });
  }
}


export const updateUser = catchAsync(async (req, res, next) => {
  try{
    const filteredBody = filterObj(req.body, 'name' , 'surname');
  
    if(req.file){

      const filename = `user-${req.user.id}-${Date.now()}.jpeg`;
           

      console.log(req.file);

      const result = await put(filename, req.file.buffer, 
        { access: 'public', 
        token : process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
      },); 
      
      console.log({result});

      filteredBody.photo = result.url;
    }

    
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new : true,
      runValidators : true,
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
