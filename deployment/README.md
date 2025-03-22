# Deploying Correcte-AI to Render.com

This README provides step-by-step instructions to deploy the Correcte-AI application to Render.com's free tier.

## Application Overview

**Correcte-AI** is an AI-powered handwriting grader for K-12 teachers that helps automate the evaluation of handwritten assignments, saving time and providing valuable analytics.

## Deployment Structure

The deployment consists of two main components:

1. **Backend API**: Node.js/Express server connected to MongoDB
2. **Frontend**: React application using Vite and Material-UI

## Prerequisites

- A [Render.com](https://render.com) account
- A MongoDB database (you can use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- Git repository with your code (GitHub, GitLab, etc.)

## Deployment Steps

### 1. Set Up MongoDB Atlas

1. Create a free MongoDB Atlas account if you don't have one
2. Create a new cluster (the free tier is sufficient)
3. Create a database user with password
4. Configure network access (allow access from anywhere for testing)
5. Get your MongoDB connection string

### 2. Deploy to Render.com

You have two options for deployment:

#### Option 1: Manual Deployment

1. **Deploy the Backend**:
   - Go to your Render.com dashboard
   - Click "New" and select "Web Service"
   - Connect your GitHub/GitLab repository
   - Configure the service:
     - Name: `correcte-ai-api`
     - Root Directory: `deployment/backend`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `npm start`
   - Add the following environment variables:
     - `MONGODB_URI` = Your MongoDB connection string
     - `JWT_SECRET` = A secure random string
     - `NODE_ENV` = `production`
   - Click "Create Web Service"

2. **Deploy the Frontend**:
   - Go to your Render.com dashboard
   - Click "New" and select "Web Service"
   - Connect your GitHub/GitLab repository
   - Configure the service:
     - Name: `correcte-ai-frontend`
     - Root Directory: `deployment/frontend`
     - Environment: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm run preview`
   - Add the following environment variables:
     - `VITE_API_URL` = Your backend URL + `/api` (e.g., `https://correcte-ai-api.onrender.com/api`)
   - Click "Create Web Service"

#### Option 2: Using render.yaml (Blueprint)

1. Push the `render.yaml` file to your repository
2. In your Render dashboard, click "Blueprints"
3. Connect your repository
4. The services defined in `render.yaml` will be automatically detected
5. Configure the environment variables (particularly `MONGODB_URI`)
6. Deploy the blueprint

### 3. Post-Deployment Setup

1. Wait for the services to deploy (this may take a few minutes on Render's free tier)
2. Once both services are deployed, go to your frontend URL
3. Use the "Create Admin" button on the login page to create an admin account
4. Log in with the provided credentials

## Admin Access

The application will create an admin account with default credentials when you click the "Create Admin" button on the login page. The credentials will be displayed on the screen.

You can then use these credentials to log in and access all features of the application.

## Testing the Deployment

1. Go to your frontend URL (e.g., `https://correcte-ai-frontend.onrender.com`)
2. Log in with the admin credentials
3. Navigate to the dashboard and test creating assignments, submissions, etc.

## Troubleshooting

- **Backend not connecting to MongoDB**: Verify your MongoDB URI is correct and that network access is properly configured
- **Frontend not connecting to backend**: Check that your `VITE_API_URL` environment variable is correctly set
- **Deployment failing**: Check the logs in your Render.com dashboard for specific error messages

## Limitations of Free Tier

1. **Spin-down after inactivity**: Render's free tier will spin down your service after 15 minutes of inactivity, causing a delay on the first request after inactivity
2. **Limited resources**: Free tier services have limited CPU and memory
3. **Limited bandwidth**: There's a monthly bandwidth cap

## Upgrading

For production use, consider upgrading to a paid tier on Render.com for better performance and reliability.

## Support

For issues related to deployment, check the Render.com documentation or contact their support.

---

Good luck with your deployment! Correcte-AI is now ready to help K-12 teachers grade handwritten assignments more efficiently.
