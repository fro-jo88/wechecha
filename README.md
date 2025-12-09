# Construction Inventory Management System

## Overview
Full-stack Construction Inventory Management System with multi-location tracking, role-based access control, and "Finish Site" workflow constraints.

## Tech Stack
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT with bcryptjs

## Features
✅ Database schema with Locations (Stores/Sites), Users, Items, Inventory, Transfers  
✅ JWT authentication with role-based access (Super Admin, Store Manager, Site Engineer)  
✅ "Finish Site" workflow with inventory validation  
✅ Super Admin Dashboard with God View  
✅ Login page with beautiful UI  
✅ Role-based dashboard routing  

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database running
- npm or yarn

### 1. Clone and Navigate
```bash
cd wechecha
```

### 2. Setup Backend
````bash
cd backend
npm install
```

### 3. Configure Database
Edit `backend/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/wechecha?schema=public"
PORT=3001
JWT_SECRET="your-secret-key-change-in-production"
```

### 4. Run Migrations and Seed
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Start Backend
```bash
npm run dev
# Runs on http://localhost:3001
```

### 6. Setup Frontend (New Terminal)
```bash
cd frontend
npm install
```

### 7. Start Frontend
```bash
npm run dev
# Runs on http://localhost:3000
```

### 8. Login
Open browser to `http://localhost:3000`

**Demo Credentials:**
- Super Admin: `superadmin@test.com` / `password`
- Store Manager: `storemanager@test.com` / `password`
- Site Engineer: `siteengineer@test.com` / `password`

## API Endpoints

### Auth
- `POST /api/auth/login` - Login with email/password

### Sites
- `POST /api/sites/:id/finish` - Finish a site (Super Admin only)

## Database Schema
- **Locations:** Stores and Sites with status tracking
- **Users:** Role-based with location assignment
- **Items:** Product catalog
- **Inventory:** Quantity tracking per location
- **Transfers:** Movement audit trail

## Project Structure
```
wechecha/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   └── siteController.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── siteRoutes.ts
│   │   ├── prismaClient.ts
│   │   └── server.ts
│   └── .env
└── frontend/
    └── app/
        ├── components/
        │   └── dashboard/
        │       └── SuperAdminDashboard.tsx
        ├── dashboard/
        │   ├── superadmin/page.tsx
        │   ├── store/page.tsx
        │   └── site/page.tsx
        ├── login/page.tsx
        └── page.tsx
```

## Next Steps
- Add CRUD endpoints for Locations, Items, Users
- Implement Transfer workflow
- Add inventory dispatch features
- Enhance Store Manager and Site Engineer dashboards
- Add real-time notifications
- Deploy to production
