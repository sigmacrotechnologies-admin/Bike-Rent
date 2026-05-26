# Local MongoDB + Backend Setup Guide

Follow these steps to run **VelocityRent Backend** with **MongoDB on your local machine**.

---

## Step 1 — Install MongoDB (if not installed)

### Windows
1. Download [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Install with **MongoDB as a Service** checked
3. Verify it's running:

```powershell
Test-NetConnection localhost -Port 27017
# TcpTestSucceeded should be True
```

### Alternative — MongoDB Compass (GUI)
Download [MongoDB Compass](https://www.mongodb.com/try/download/compass) to view your database visually.

---

## Step 2 — Configure Environment

From project root:

```powershell
cd D:\Products\Bike_Rent
copy .env.example .env
```

Your `.env` should include:

```env
MONGODB_URI=mongodb://localhost:27017/velocity_rent
PORT=5000
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Step 3 — Install Dependencies

```powershell
cd D:\Products\Bike_Rent\backend
npm install

cd ..\apps\web
npm install
```

---

## Step 4 — Seed MongoDB with Sample Data

Make sure MongoDB is running, then:

```powershell
cd D:\Products\Bike_Rent\backend
npm run seed
```

This creates:
- Demo users (admin + customer)
- 10 bikes, 12 cars, EVs, scooters
- Sample bookings, reviews, GPS logs, coupons
- Vehicle thumbnails linked to `/assets/vehicles/` images

---

## Step 5 — Start Backend + Frontend

**Terminal 1 — Backend API:**
```powershell
cd D:\Products\Bike_Rent\backend
npm run dev
```
API runs at: http://localhost:5000

**Terminal 2 — Frontend:**
```powershell
cd D:\Products\Bike_Rent\apps\web
npm run dev
```
Website runs at: http://localhost:3000

---

## Step 6 — Verify MongoDB Data

### Option A — API health check
```powershell
Invoke-WebRequest http://localhost:5000/health
Invoke-WebRequest "http://localhost:5000/api/v1/vehicles?type=bike"
```

### Option B — MongoDB Compass
1. Connect to: `mongodb://localhost:27017`
2. Open database: `velocity_rent`
3. Collections: `users`, `vehicles`, `bookings`, `payments`, etc.

### Option C — mongosh
```powershell
mongosh mongodb://localhost:27017/velocity_rent
show collections
db.vehicles.countDocuments()
db.vehicles.find({ type: "bike" }).pretty()
```

---

## Demo Login Credentials

| Role     | Email                      | Password       |
|----------|----------------------------|----------------|
| Admin    | admin@velocityrent.com     | Admin@123456   |
| Customer | customer@velocityrent.com| Customer@123   |

---

## Adding Your Own Bike Images

1. Place images in:
   ```
   apps/web/public/assets/vehicles/bikes/
   apps/web/public/assets/vehicles/cars/
   ```

2. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`

3. Update thumbnail in seed data (`backend/src/utils/seed.data.js`):
   ```js
   thumbnail: '/assets/vehicles/bikes/your-bike-name.jpg',
   ```

4. Re-run seed:
   ```powershell
   cd backend
   npm run seed
   ```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `MongoDB connection error` | Start MongoDB service: `net start MongoDB` |
| `Invalid credentials` on login | Run `npm run seed` again to reset passwords |
| Vehicles not showing | Run seed + restart backend |
| Port 5000 in use | Change `PORT=5001` in `.env` |
| Port 3000 in use | Next.js auto-uses 3001, or kill old process |

---

## Quick One-Command Re-seed

```powershell
cd D:\Products\Bike_Rent\backend; npm run seed
```
