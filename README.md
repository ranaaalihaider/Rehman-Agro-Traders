# Rehman Agro Traders - Stock Management System

A complete MERN stack web application for inventory tracking (Stock In and Stock Out), featuring a professional agriculture-themed dashboard, company & item management, invoice printing, history logs, settings profile editor, and date-wise stock balance history reports.

---

## 🛠️ Technology Stack
- **Frontend**: React.js with Vite, Tailwind CSS, Lucide icons, Recharts, Axios, React Router.
- **Backend**: Node.js, Express.js, Mongoose, JSON Web Tokens (JWT), BcryptJS.
- **Database**: MongoDB Atlas.

---

## 📁 Project Structure
```text
Rehman Agro Traders/
├── backend/
│   ├── config/            # Mongoose DB connection configuration
│   ├── controllers/       # Core business logic (auth, items, transactions, reports)
│   ├── middleware/        # Authentication routes protection
│   ├── models/            # MongoDB/Mongoose Schemas (Item, Company, Tx, Log, User, Profile)
│   ├── routes/            # Express REST endpoint maps
│   ├── tests/             # Automated inventory logic test runner
│   ├── .env               # Environment configs (Port, Secret keys, MongoDB URI)
│   ├── package.json       # Backend script dependencies
│   └── server.js          # Backend API server startup entry
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, Sidebar, print-friendly Invoice component
│   │   ├── context/       # Auth State Provider (JWT storage)
│   │   ├── pages/         # Dashboard, Items, Companies, Invoicing, Summary, Logs, Settings
│   │   ├── utils/         # Axios config with JWT header interceptors
│   │   ├── App.jsx        # Routing configuration
│   │   └── index.css      # Custom styles and print media rules
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind CSS theme variables (Emerald Green theme)
├── run_all.bat            # Double-click to start both Frontend & Backend
└── run_tests.bat          # Double-click to run automated calculation logic tests
```

---

## 🔐 Default Access Credentials
Upon initial launch, the system automatically checks if any users exist. If not, it seeds the following credentials:
- **Username**: `admin`
- **Password**: `adminpassword`

*You can update the password and details at any time from the **Settings** page within the dashboard.*

---

## 🚀 Setup & Launching Locally

### Prerequisites
- Make sure [Node.js](https://nodejs.org) is installed on your system.

### Automated Launch (Recommended)
1. **Double-click `run_all.bat`** at the root of the project.
2. This script launches the backend database listener (on `http://localhost:5000`) and the Vite React server (on `http://localhost:5173`) in separate windows.
3. Open `http://localhost:5173` in your browser.

### Running Automated Logic Tests
1. **Double-click `run_tests.bat`** at the root of the project.
2. It spins up a test suite checking Stock In, Stock Out, Edit differential stock movements, and Delete stock reversals, and outputs results.

---

## ☁️ Deployment Instructions

### 1. Database (MongoDB Atlas)
The connection string is already embedded in the backend `.env` file. For production:
1. Ensure your MongoDB Atlas cluster has IP Access list configured to **Allow Access from Anywhere (`0.0.0.0/0`)** since Render servers have dynamic IPs.

### 2. Backend (Render.com)
1. Sign up on [Render](https://render.com).
2. Create a new **Web Service** and link your Git repository.
3. Configure the following build settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add the following **Environment Variables** in Render settings:
   - `PORT`: `5000` (or leave blank)
   - `MONGO_URI`: `mongodb+srv://saadawan7867_db_user:4PKoUFbC4Giw3XCY@cluster0.5cimkm3.mongodb.net/rehman_agro_traders?appName=Cluster0`
   - `JWT_SECRET`: `rehman_agro_traders_secret_key_2026_xyz`

### 3. Frontend (Vercel)
1. Sign up on [Vercel](https://vercel.com).
2. Import your Git repository.
3. Configure the following project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variables** in Vercel settings:
   - `VITE_API_URL`: Set to the Render Web Service URL (e.g. `https://rehman-agro-api.onrender.com/api`).
