# Donation System

A full-stack MERN application for managing donations and campaigns.

## Project Structure

- **Frontend**: React with Vite, TailwindCSS
- **Backend**: Node.js, Express.js, MongoDB
- **Payment**: Cashfree Payment Gateway

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `backend/.env` (see `backend/.env.example`)
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment on Render.com

### Prerequisites
- GitHub repository
- MongoDB Atlas database
- Cashfree account for payment processing

### Steps

1. **Connect Repository to Render**
   - Go to [Render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Node Version: 18.20.0 (auto-detected from .node-version)

3. **Environment Variables**
   Set these in your Render dashboard:
   
   **Required:**
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT tokens
   - `CASHFREE_CLIENT_ID`: Your Cashfree client ID
   - `CASHFREE_CLIENT_SECRET`: Your Cashfree client secret
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   
   **Optional:**
   - `CASHFREE_PAYOUT_CLIENT_ID`: For payout functionality
   - `CASHFREE_PAYOUT_CLIENT_SECRET`: For payout functionality
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: For email functionality

4. **Update URLs**
   After deployment, update these environment variables with your actual Render URL:
   - `CASHFREE_RETURN_URL`: `https://your-app-name.onrender.com/payment-success`
   - `FRONTEND_URL`: `https://your-app-name.onrender.com`
   - `BACKEND_URL`: `https://your-app-name.onrender.com`
   - `CORS_ORIGIN`: `https://your-app-name.onrender.com`

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

### Features
- User authentication with JWT
- Campaign management
- Donation processing with Cashfree
- File uploads for campaign images
- NGO management
- Payment history and analytics

### Tech Stack
- **Frontend**: React 19, Vite, TailwindCSS, React Router, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Payment**: Cashfree Payment Gateway
- **File Upload**: Cloudinary for image storage and optimization

### Scripts
- `npm run dev`: Start development servers (both frontend and backend)
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run render-postbuild`: Post-build script for Render deployment

### Environment Variables Example
See `backend/.env.example` for all required environment variables.

### Health Check
The application includes a health check endpoint at `/api/auth/health` for monitoring.
