import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Check if Cloudinary credentials are provided
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ CLOUDINARY CREDENTIALS MISSING!');
  console.error('⚠️  Please set the following environment variables:');
  console.error('   - CLOUDINARY_CLOUD_NAME');
  console.error('   - CLOUDINARY_API_KEY');
  console.error('   - CLOUDINARY_API_SECRET');
  console.error('💡 In Render: Go to Environment tab and add these variables');
  console.error('📱 Image uploads will fail until these are configured.');
  console.error('='.repeat(60));
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary
export const uploadToCloudinary = async (fileBuffer, folder = 'donation-system') => {
  try {
    console.log(`Cloudinary upload - Buffer size: ${fileBuffer ? fileBuffer.length : 0} bytes, Folder: ${folder}`);
    
    // Check credentials before attempting upload
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }
    
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('No file buffer provided or buffer is empty');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', {
              url: result.secure_url,
              public_id: result.public_id,
              format: result.format,
              bytes: result.bytes
            });
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('uploadToCloudinary error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

// Upload multiple images to Cloudinary
export const uploadMultipleToCloudinary = async (fileBuffers, folder = 'donation-system') => {
  try {
    const uploadPromises = fileBuffers.map(buffer => uploadToCloudinary(buffer, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error(`Multiple upload failed: ${error.message}`);
  }
};

export default cloudinary;
