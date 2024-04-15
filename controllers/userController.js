import User from './../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from './../utils/catchAsync.js';
import multer from 'multer'
import multerS3 from "multer-s3"
import aws from "aws-sdk"

// Configure AWS S3
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

const s3 = new aws.S3();

// Define multer upload settings
export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "pomo-images",
    acl: 'public-read', // Set ACL to public-read
    key: function (req, file, cb) {
      cb(null, `user-${req.user.id}-${Date.now()}.jpeg`); // Define object key
    }
  })
}).single('photo');

export const updateUserPhoto = async (req, res) => {
  try {
    const file = req.file;
    console.log({ file });

    // Fetch user data from the database
    const user = await User.findById(req.params.id);

    // Check if the user already has a photo
    
    if (false) {
      console.log("existing file name", user.photo);

      // Delete the existing photo from S3
      await s3.deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME, 
        Key: user.photo,
      }).promise();
    }
    
    // Upload the file to S3
    const result = await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `user-${req.user.id}-${Date.now()}.jpeg`,
      Body: file.buffer,
      ACL:'public-read'
    }).promise();

    const uploadedImageUrl = result.Location;

    // Update the user's photo field in MongoDB
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { photo: uploadedImageUrl }, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while uploading the file.' });
  }
};


export const updateUser = catchAsync(async (req, res, next) => {
  try {

    const filteredBody = filterObj(req.body, 'name', 'surname', 'photo');

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
