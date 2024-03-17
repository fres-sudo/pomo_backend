import app from "./../app.js";

import { connect } from 'mongoose';
import { config } from 'dotenv';

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


export default app;