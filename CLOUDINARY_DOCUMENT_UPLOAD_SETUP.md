# Cloudinary Upload Preset Setup for NGO Documents

## Steps to Create Upload Preset

1. **Login to Cloudinary Console**
   - Go to [Cloudinary Console](https://console.cloudinary.com/)
   - Login with your account

2. **Navigate to Settings**
   - Click on the gear icon (Settings) in the top right
   - Go to "Upload" tab

3. **Add Upload Preset**
   - Click "Add upload preset" button
   - Fill in the following details:

### Upload Preset Configuration:

```
Preset name: ngo_documents
Signing mode: Unsigned (allows direct upload from frontend)
```

### Folder & Public ID:
```
Folder: ngo-documents
Use filename as public ID: No
Unique filename: Yes
Overwrite: No
```

### Image Transformations:
```
Mode: Scale
Width: 1920 (max width)
Height: 1080 (max height)
Crop: limit
Quality: auto:good
Format: auto
```

### Access Control:
```
Resource type: Auto
Allowed formats: jpg,png,pdf,jpeg
Max file size: 5242880 (5MB)
```

### Backup & Archive:
```
Backup: No (to save storage)
```

4. **Save Preset**
   - Click "Save" button
   - Note down the preset name: `ngo_documents`

## Frontend Configuration

The upload preset name is already configured in:
- `frontend/src/components/DocumentUploadForm.jsx`
- Line 11: `const CLOUDINARY_UPLOAD_PRESET = 'ngo_documents';`

## Alternative: Using Signed Uploads

For enhanced security, you can use signed uploads:

1. **Change Upload Preset to Signed Mode**
2. **Create Backend Endpoint** for generating signatures:

```javascript
// backend/routers/bank.route.js
router.post('/generate-cloudinary-signature', async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: 'ngo-documents'
    },
    process.env.CLOUDINARY_API_SECRET
  );
  
  res.json({
    timestamp: timestamp,
    signature: signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME
  });
});
```

3. **Update Frontend** to use signed upload

## Current Setup Status

✅ Cloudinary credentials configured in `.env`
✅ Frontend upload component ready
✅ Document processing in pending transactions
⏳ **REQUIRED**: Create `ngo_documents` upload preset in Cloudinary console

## Testing the Upload

1. Complete the upload preset setup above
2. Start both backend and frontend servers
3. Access NGO Dashboard: `http://localhost:3000/ngo-dashboard`
4. Simulate bank withdrawal to create pending transaction
5. Upload document using either method:
   - **File Upload**: Select file from device (auto-uploads to Cloudinary)
   - **URL Upload**: Provide existing Cloudinary URL

## Security Notes

- Unsigned presets allow direct uploads but are less secure
- Consider using signed uploads for production
- Set appropriate file size limits (currently 5MB)
- Restrict allowed file formats (jpg, png, pdf)
- Monitor upload usage in Cloudinary dashboard