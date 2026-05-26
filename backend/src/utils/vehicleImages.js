/** Maps registration numbers to frontend public asset paths */
export const VEHICLE_THUMBNAILS = {
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
  MH12EV5678: '/assets/vehicles/defaults/ev.svg',
  MH12SC3456: '/assets/vehicles/defaults/scooter.svg',
};

export const getThumbnail = (registrationNumber, type = 'bike') =>
  VEHICLE_THUMBNAILS[registrationNumber] || `/assets/vehicles/defaults/${type}.svg`;
