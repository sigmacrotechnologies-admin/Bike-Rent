# Vehicle Image Assets

Place vehicle photos here. They are served at `/assets/vehicles/...`

## Folder Structure

```
assets/vehicles/
├── bikes/          ← Bike photos (jpg, png, webp, svg)
├── cars/           ← Car photos
├── ev/             ← EV photos (optional)
├── scooters/       ← Scooter photos (optional)
└── defaults/       ← Fallback images per vehicle type
```

## Replace with Real Photos

1. Add your image file, e.g.:
   ```
   bikes/royal-enfield-classic-350.jpg
   ```

2. Update thumbnail in `backend/src/utils/vehicleImages.js`:
   ```js
   MH12AB1234: '/assets/vehicles/bikes/royal-enfield-classic-350.jpg',
   ```

3. Re-seed MongoDB:
   ```powershell
   cd backend
   npm run seed
   ```

4. Refresh the website.

## Recommended Image Size

- **Card thumbnail:** 800 × 500 px (16:10 ratio)
- **Format:** JPG or WebP for photos, SVG for illustrations

## Current Assets

- 10 bike SVG illustrations in `bikes/`
- 12 car SVG illustrations in `cars/`
- Default fallbacks in `defaults/`
