import { connect } from 'mongoose';
import { config } from 'dotenv';

import express, { json } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
const xssModule = await import('xss-clean');
const xss = xssModule.default || xssModule;

import hpp from 'hpp';

import AppError from './../utils/appError.js';
import globalErrorHandler from './../controllers/errorController.js';
import userRouter from './../routes/userRoutes.js';
import taskRouter from './../routes/taskRoutes.js';
import projectRouter from './../routes/projectRoutes.js';
import { getAllUsers } from './../controllers/userController.js';

const app = express();

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Enable trusting of proxies
//app.set('trust proxy', true);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
  validate: { xForwardedForHeader: false }, // Disable X-Forwarded-For header validation
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

// 3)  ROUTES
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/users', userRouter);

app.get("/", getAllUsers) 

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);


const startServer = () => {

    process.on('uncaughtException', (err) => {
        console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        process.exit(1);
      });
        
      config({ path: './config.env' });
      
      const DB = process.env.DATABASE;
      // Log that the script is starting...
      console.log('Starting server script...');
      
      // Connect to the database
      console.log('Connecting to the database...');
      connect(DB)
        .then(() => {
          console.log('DB connection successful!✅');
          // Start the app after successful database connection
          const port = process.env.PORT || 3000;
          app.listen(port, () => {
            console.log(`App running on port ${port}...`);
          });
        })
        .catch((err) => {
          console.error('Error connecting to the database:', err);
          process.exit(1);
        });
      
      // Log that the script has finished
      console.log('Server script finished execution.👀');
      
      // Handle unhandled rejections
      process.on('unhandledRejection', (err) => {
        console.log('UNHANDLED REJECTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        process.exit(1);
      });
};

startServer();


