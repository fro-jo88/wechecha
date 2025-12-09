# Wechecha Project - Startup Guide

This guide will help you install dependencies, configure the environment, and run both the backend and frontend of your application.

## 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MySQL** (via XAMPP, WAMP, or standalone)
- **Git Bash** (recommended for running commands on Windows) or PowerShell

## 2. Backend Setup

### A. Install Dependencies
Open a terminal and run:
```bash
cd backend
npm install
```

### B. Configure Environment
1. Open `backend/.env`.
2. Check your `DATABASE_URL`. It should look like this:
   ```env
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/wechecha"
   ```
   *Replace `YOUR_PASSWORD` with your actual MySQL root password (leave empty if none).*

### C. Database Migration
Run these commands to verify the database connection and apply the schema:
```bash
npx prisma generate
npx prisma db push
```
*If you see an error here, your MySQL server is not running or your password is wrong.*

### D. Start Backend Server
```bash
npm run dev
```
You should see: `Server running on port 3001`

---

## 3. Frontend Setup

### A. Install Dependencies
Open a **new** terminal window (keep the backend running) and run:
```bash
cd frontend
npm install
```

### B. Configure Environment
We have already created a `.env.local` file for you with the following content:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
*This tells the frontend where to find the backend.*

### C. Start Frontend Server
```bash
npm run dev
```
You should see: `Ready in ... http://localhost:3000`

---

## 4. Running the App
1. Open your browser and go to: [http://localhost:3000](http://localhost:3000)
2. Log in with your credentials.
   - **Super Admin**: `superadmin@test.com` / `password` (if seeded)
   - **Store Manager**: `manager@test.com` / `password` (if seeded)

## 5. Troubleshooting checklist

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **Backend error:** `connect ECONNREFUSED` | MySQL is effectively stopped. | Start MySQL in XAMPP/WAMP. |
| **Backend error:** `Access denied for user` | Wrong DB password. | Update `backend/.env` with correct password. |
| **Frontend error:** `Network error` | Backend is not running. | Ensure backend terminal shows "Server running". |
| **Frontend error:** `404 Not Found` | Backend running on wrong port. | Check `backend/.env` has `PORT=3001` and frontend uses `http://localhost:3001`. |

## 6. Full Restart Command (Quick Copy-Paste)
If you want to restart everything fresh:

**Backend Terminal:**
```bash
cd backend
npm ci
npx prisma generate
npm run dev
```

**Frontend Terminal:**
```bash
cd frontend
npm ci
npm run dev
```
