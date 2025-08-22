import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Test campaign creation with file upload
const testCampaignUpload = async () => {
  try {
    console.log('🧪 Testing campaign creation with file upload...');
    
    // Check if test image exists, if not create a simple test
    const testImagePath = path.join(process.cwd(), 'test-image.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found. Please create a test image file named "test-image.jpg" in the backend directory');
      return;
    }

    const formData = new FormData();
    
    // Add required campaign fields
    formData.append('title', 'Test Campaign for Upload');
    formData.append('description', 'This is a test campaign to verify Cloudinary integration');
    formData.append('goal_amount', '50000');
    formData.append('category', 'Education');
    formData.append('start_date', '2025-01-01');
    formData.append('end_date', '2025-12-31');
    formData.append('contact_person', 'Test Person');
    formData.append('contact_email', 'test@example.com');
    formData.append('contact_phone', '9876543210');
    formData.append('location', 'Test Location');
    
    // Add test image as logo
    const imageBuffer = fs.readFileSync(testImagePath);
    formData.append('logo', imageBuffer, {
      filename: 'test-logo.jpg',
      contentType: 'image/jpeg'
    });
    
    // Add same image as activity photo
    formData.append('activity_photos', imageBuffer, {
      filename: 'test-activity.jpg',
      contentType: 'image/jpeg'
    });

    console.log('📤 Sending request to create campaign...');
    
    const response = await fetch('http://localhost:5000/api/campaigns/create', {
      method: 'POST',
      body: formData,
      headers: {
        // Add authentication header if you have a test token
        // 'Authorization': 'Bearer your-test-token'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Campaign created successfully!');
      console.log('Campaign ID:', result.campaign_id);
      console.log('Response:', result);
    } else {
      console.log('❌ Campaign creation failed');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Create a simple test image if it doesn't exist
const createTestImage = () => {
  const testImagePath = path.join(process.cwd(), 'test-image.jpg');
  
  if (!fs.existsSync(testImagePath)) {
    // Create a minimal JPEG file for testing
    // This is a 1x1 pixel red JPEG
    const jpegBytes = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
      0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, jpegBytes);
    console.log('✅ Created test image:', testImagePath);
  }
};

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestImage();
  // Note: This test requires authentication, so it might fail without proper setup
  console.log('To test uploads, you need to:');
  console.log('1. Have the server running (npm run dev)');
  console.log('2. Be authenticated as an NGO user');
  console.log('3. Have completed NGO verification');
  console.log('4. Run: node test-upload.js');
}

export { testCampaignUpload, createTestImage };
