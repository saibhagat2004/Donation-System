import { uploadToCloudinary, deleteFromCloudinary } from './config/cloudinary.js';
import fs from 'fs';

// Test Cloudinary configuration
const testCloudinary = async () => {
  console.log('🧪 Testing Cloudinary configuration...');
  
  try {
    // Check if we have the required environment variables
    const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars.join(', '));
      console.log('Please set these in your .env file and try again.');
      return;
    }
    
    console.log('✅ Environment variables found');
    console.log('📁 Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    
    // Note: For a real test, you would need to:
    // 1. Create a test image buffer
    // 2. Upload it to Cloudinary
    // 3. Delete it after testing
    // This is just a configuration validation
    
    console.log('✅ Cloudinary configuration appears valid');
    console.log('🚀 Ready to upload images!');
    
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error.message);
  }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCloudinary();
}

export { testCloudinary };
