import mongoose from 'mongoose';

const connectDB = (url) => {
  // Check if URL is provided
  if (!url) {
    console.error('Error: MongoDB Connection String is missing.');
    process.exit(1);
  }

  return mongoose.connect(url);
};

export default connectDB;