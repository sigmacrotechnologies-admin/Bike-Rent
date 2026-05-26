export const VEHICLE_IMAGE_MAP: Record<string, string> = {
  // Bikes
  MH12AB1234: '/assets/vehicles/bikes/royal-enfield-classic-350.svg',
  MH12BK2345: '/assets/vehicles/bikes/royal-enfield-hunter-350.svg',
  MH12KT3456: '/assets/vehicles/bikes/ktm-duke-200.svg',
  MH12YM4567: '/assets/vehicles/bikes/yamaha-mt15.svg',
  MH12PJ5678: '/assets/vehicles/bikes/bajaj-pulsar-ns200.svg',
  MH12HN6789: '/assets/vehicles/bikes/honda-cb350.svg',
  MH12TV7890: '/assets/vehicles/bikes/tvs-apache-rtr160.svg',
  MH12XP8901: '/assets/vehicles/bikes/hero-xpulse-200.svg',
  MH12KN9012: '/assets/vehicles/bikes/kawasaki-ninja-300.svg',
  MH12SZ0123: '/assets/vehicles/bikes/suzuki-gixxer-sf250.svg',
  // Cars
  MH14CR9012: '/assets/vehicles/cars/hyundai-creta.svg',
  MH14SW1234: '/assets/vehicles/cars/maruti-swift.svg',
  MH14NX2345: '/assets/vehicles/cars/tata-nexon.svg',
  MH14HC3456: '/assets/vehicles/cars/honda-city.svg',
  MH14IN4567: '/assets/vehicles/cars/toyota-innova.svg',
  MH14XU5678: '/assets/vehicles/cars/mahindra-xuv700.svg',
  MH14KS6789: '/assets/vehicles/cars/kia-seltos.svg',
  MH14MG7890: '/assets/vehicles/cars/mg-hector.svg',
  MH14VW8901: '/assets/vehicles/cars/vw-virtus.svg',
  MH14BM9012: '/assets/vehicles/cars/bmw-320i.svg',
  MH14TP0123: '/assets/vehicles/cars/tata-punch.svg',
  MH14SK1234: '/assets/vehicles/cars/skoda-kushaq.svg',
  // EV & Scooter
  MH12EV5678: '/assets/vehicles/ev/tesla-model3.svg',
  MH12SC3456: '/assets/vehicles/scooters/ather-450x.svg',
};

export function getVehicleImage(vehicle: {
  thumbnail?: string;
  registrationNumber?: string;
  type?: string;
  name?: string;
}): string {
  if (vehicle.thumbnail) return vehicle.thumbnail;
  if (vehicle.registrationNumber && VEHICLE_IMAGE_MAP[vehicle.registrationNumber]) {
    return VEHICLE_IMAGE_MAP[vehicle.registrationNumber];
  }
  const type = vehicle.type || 'bike';
  return `/assets/vehicles/defaults/${type}.svg`;
}
