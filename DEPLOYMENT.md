# Deploying Task Manager

This repository is a monorepo: deploy `server` to Render and `client` to Vercel.

## Before deploying

1. Create a private GitHub repository and push this project. Do not commit `.env` files or the downloaded Google client-secret JSON file.
2. In MongoDB Atlas, ensure the database user in `MONGO_URI` has access to the target database. Atlas blocks network access by default. For a simple initial Render deployment, add `0.0.0.0/0` to the Atlas IP access list. Use a more restrictive private-network solution when you move to a paid production setup.

## Render API

1. In Render, create a **Web Service** from the repository, set its Root Directory to `server`, Build Command to `npm install && npm run build`, Start Command to `npm start`, and Health Check Path to `/health`.
2. Set these environment variables in the Render dashboard. Never enter surrounding quotes.

   ```text
   MONGO_URI=<Atlas connection string>
   GOOGLE_CLIENT_ID=<browser Google-login client ID>
   CLIENT_URL=<set after the Vercel production URL is known>
   EMAIL_USER=<the Gmail address that sends recovery mail>
   GMAIL_OAUTH_CLIENT_ID=<Gmail sending OAuth client ID>
   GMAIL_OAUTH_CLIENT_SECRET=<Gmail sending OAuth client secret>
   GMAIL_OAUTH_REDIRECT_URI=https://<your-render-service>.onrender.com/api/auth/gmail/callback
   GMAIL_OAUTH_REFRESH_TOKEN=<set after completing production Gmail OAuth setup>
   GMAIL_OAUTH_SETUP_SECRET=<a long random value>
   ```

   Render generates `JWT_SECRET` from the Blueprint. Do not replace it unless you deliberately want to invalidate every existing login.
3. Deploy and open `https://<your-render-service>.onrender.com/health`. It must return a successful JSON response.

## Vercel frontend

1. In Vercel, import the same repository.
2. Set **Root Directory** to `client` and choose the Vite framework preset.
3. Add these production environment variables:

   ```text
   VITE_API_URL=https://<your-render-service>.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=<browser Google-login client ID>
   ```

4. Deploy. Copy the production URL, for example `https://task-manager.vercel.app`.
5. In Render, set `CLIENT_URL` to that Vercel URL. To keep local development working, use a comma-separated value:

   ```text
   CLIENT_URL=http://localhost:5173,https://task-manager.vercel.app
   ```

6. Redeploy Render after changing `CLIENT_URL`, then test sign-in and task loading from Vercel.

## Google OAuth changes for production

You need two OAuth clients in Google Cloud:

1. **Browser sign-in client** (used by `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID`): add the Vercel production URL under **Authorized JavaScript origins**.
2. **Gmail sending client** (used by `GMAIL_OAUTH_*`): add this exact URL under **Authorized redirect URIs**:

   ```text
   https://<your-render-service>.onrender.com/api/auth/gmail/callback
   ```

After the Render redirect URI is saved and the Render variables are present, open this once in a private browser:

```text
https://<your-render-service>.onrender.com/api/auth/gmail/setup?setupKey=<GMAIL_OAUTH_SETUP_SECRET>
```

Sign in with `EMAIL_USER`. Copy the refresh token printed in Render's logs into `GMAIL_OAUTH_REFRESH_TOKEN`, then redeploy Render.

### Important Gmail restriction

The Gmail SMTP scope (`https://mail.google.com/`) is restricted. While the Google app is in **Testing**, the sending Gmail account must be listed as a test user and its refresh token expires after seven days. For a durable public-production flow, complete Google's required verification for the restricted scope or replace Gmail SMTP with a transactional provider such as Resend, Postmark, or Brevo.

## Final checks

1. Open the Vercel URL and register or sign in.
2. Create a task and refresh the page.
3. Use Forgot Password and confirm the message arrives.
4. Confirm Google sign-in works on the Vercel URL.
5. Check Render logs for authentication or mail errors.
