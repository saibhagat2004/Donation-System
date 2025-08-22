import express from "express";
import { uploadMemory } from "../middleware/uploadMiddleware.js";
import { debugRequest } from "../middleware/debugMiddleware.js";

const router = express.Router();

// Test endpoint to debug file uploads
router.post("/test-upload", 
  uploadMemory.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'activity_photos', maxCount: 20 }
  ]),
  debugRequest,
  (req, res) => {
    console.log('=== TEST UPLOAD ENDPOINT ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    if (req.files) {
      Object.entries(req.files).forEach(([fieldName, files]) => {
        console.log(`Field ${fieldName}:`);
        const fileArray = Array.isArray(files) ? files : [files];
        fileArray.forEach((file, index) => {
          console.log(`  File ${index}:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            bufferLength: file.buffer?.length || 0,
            hasBuffer: !!file.buffer
          });
        });
      });
    }
    
    res.json({
      success: true,
      filesReceived: req.files ? Object.keys(req.files) : [],
      fileDetails: req.files || {},
      message: 'Files received successfully'
    });
  }
);

export default router;
