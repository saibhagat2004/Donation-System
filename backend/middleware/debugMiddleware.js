// Debug middleware to log request details
export const debugRequest = (req, res, next) => {
  console.log('=== REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
  
  if (req.files) {
    Object.entries(req.files).forEach(([fieldName, files]) => {
      console.log(`Field ${fieldName}:`, Array.isArray(files) ? files.length : 1, 'files');
      const fileArray = Array.isArray(files) ? files : [files];
      fileArray.forEach((file, index) => {
        console.log(`  File ${index}:`, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          fieldname: file.fieldname,
          hasBuffer: !!file.buffer,
          bufferLength: file.buffer?.length || 0
        });
      });
    });
  }
  console.log('=== END DEBUG ===');
  next();
};
