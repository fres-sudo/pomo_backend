import { connect } from 'mongoose';
import { config } from 'dotenv';
import { app } from './app.js';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

config({ path: './config.env' });

const DB =
  'mongodb+srv://francesco_calicchio:xF8uRdRs528p2kj7G7Bm8@pomoapp.nhmjh5n.mongodb.net/';

// Log that the script is starting
console.log('Starting server script...');

// Connect to the database
console.log('Connecting to the database...');
connect(DB)
  .then(() => {
    console.log('DB connection successful!');
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
console.log('Server script finished execution.');

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
