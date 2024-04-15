import express from 'express';
import * as authController from './../controllers/authController.js';
import * as userController from './../controllers/userController.js';

import multer from "multer";

const upload = multer();

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/recoverPassword/:token', authController.resetPassword);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword,
);

//router.patch('/updateMe', authController.protect, userController.updateMe);
router.delete('/:id', authController.protect, userController.deleteMe);

router.get('/', userController.getAllUsers);
//.post(userController.createUser);

router.route('/:id').put(authController.protect, userController.updateUser)
router.route('/uploadPhoto/:id').put(authController.protect, upload.single('photo'), userController.updateUserPhoto)
//  .route('/:id')
//  .get(userController.getUser)
//  .delete(userController.deleteUser);

export default router;
