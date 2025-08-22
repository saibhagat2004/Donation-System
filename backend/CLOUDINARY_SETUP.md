# Cloudinary Integration Setup

This project has been migrated from local file storage (Multer) to Cloudinary for image uploads. Here's how to set it up:

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After signing up, go to your Dashboard
3. You'll see your account details including:
   - Cloud Name
   - API Key
   - API Secret

## 2. Environment Variables

Add the following environment variables to your `.env` file:

```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace the values with your actual Cloudinary credentials.

## 3. Features

### Image Upload
- **Logo**: Single image upload for campaign logo
- **Activity Photos**: Multiple images (up to 20) for campaign activity photos
- **Automatic Optimization**: Images are automatically optimized for web delivery
- **Folder Organization**: Images are organized in folders:
  - `donation-system/campaigns/logos/` - Campaign logos
  - `donation-system/campaigns/activity-photos/` - Campaign activity photos

### Image Management
- **Automatic Deletion**: When a campaign is deleted, associated images are automatically removed from Cloudinary
- **Public ID Tracking**: Each image's Cloudinary public ID is stored for management
- **Error Handling**: Robust error handling for upload failures

## 4. File Size and Limits

- **Maximum file size**: 5MB per image
- **Maximum files**: 21 total (1 logo + 20 activity photos)
- **Supported formats**: All image formats supported by Cloudinary (JPEG, PNG, WebP, etc.)

## 5. Migration from Local Storage

The following changes were made during migration:

### Database Schema Changes
- Added `logo_public_id` field to store Cloudinary public ID for logo
- Added `activity_photos_public_ids` array to store public IDs for activity photos
- `logo` field now stores Cloudinary URL instead of local file path
- `activity_photos` array now stores Cloudinary URLs instead of local file paths

### Code Changes
- Replaced local file storage with Cloudinary API calls
- Updated upload middleware to use memory storage instead of disk storage
- Added Cloudinary configuration and utility functions
- Updated delete operations to remove images from Cloudinary

## 6. Benefits of Cloudinary

1. **No local storage management**: No need to manage local file uploads folder
2. **Automatic optimization**: Images are automatically optimized for web delivery
3. **CDN delivery**: Fast global content delivery
4. **Image transformations**: Built-in image processing capabilities
5. **Backup and reliability**: Cloudinary handles image backup and availability
6. **Scalability**: No storage limitations on your server

## 7. Error Handling

The system includes comprehensive error handling:
- Upload failures are caught and reported
- Missing credentials are detected and warned about
- File size and count limits are enforced
- Only image files are accepted

## 8. Testing

To test the integration:
1. Set up your Cloudinary credentials in `.env`
2. Start the server
3. Create a campaign with image uploads through the API
4. Check your Cloudinary dashboard to see the uploaded images

## 9. Fallback

If Cloudinary credentials are not configured, the system will:
- Log a warning message during startup
- Continue to function for non-image operations
- Return appropriate error messages for image upload attempts
