# Deployment Guide for Rehman Agro Traders

This guide details how to deploy the Rehman Agro Traders full-stack application for free using Render (for the backend API) and Vercel (for the React/Vite frontend).

---

## 1. Deploy the Backend (Render)

Render hosts Node.js/Express services for free.

1. Go to [Render](https://render.com/) and sign in using your GitHub account.
2. Click **New +** > **Web Service**.
3. Select the **Rehman-Agro-Traders** repository.
4. Set the following configuration:
   - **Name:** `rehman-agro-backend`
   - **Root Directory:** `backend` *(Ensure this is set to deploy the server folder)*
   - **Language:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Scroll down, click **Advanced**, and add these **Environment Variables**:
   - `PORT` = `10000`
   - `MONGO_URI` = `mongodb+srv://saadawan7867_db_user:4PKoUFbC4Giw3XCY@cluster0.5cimkm3.mongodb.net/rehman_agro_traders?appName=Cluster0`
   - `JWT_SECRET` = `rehman_agro_traders_secret_key_2026_xyz`
6. Click **Deploy Web Service**. Render will build the service and provide a live URL (e.g., `https://rehman-agro-backend.onrender.com`). **Copy this URL.**

---

## 2. Deploy the Frontend (Vercel)

Vercel hosts static websites and React apps for free.

1. Go to [Vercel](https://vercel.com/) and sign in using your GitHub account.
2. Click **Add New** > **Project**.
3. Select the **Rehman-Agro-Traders** repository.
4. Set the following configuration:
   - **Root Directory:** Edit and select `frontend`.
   - **Framework Preset:** `Vite` *(detected automatically)*.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand the **Environment Variables** section and add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://rehman-agro-backend.onrender.com/api` *(replace with your actual Render backend URL, appending `/api` at the end)*
6. Click **Deploy**. Vercel will build your frontend and give you a live web URL (e.g., `https://rehman-agro-traders.vercel.app`).
