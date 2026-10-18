// A starting place from the phone's time zone (2026-10-13, Sevaan: the example sky was always Peterborough). The time
// zone needs no permission and no network, and puts the sky within a few hundred km for most people: close enough that
// the same satellites, planets and stars are up. Each zone maps to a well-known city in it: [lat, lon, city].
// placeFromTimeZone() → { lat, lon, label } or null (unknown zone: the caller keeps its own default).
export const TZ_PLACES = {
  // Canada
  'America/St_Johns': [47.56, -52.71, "St. John's"], 'America/Halifax': [44.65, -63.58, 'Halifax'], 'America/Moncton': [46.09, -64.78, 'Moncton'],
  'America/Glace_Bay': [46.2, -59.96, 'Sydney, NS'], 'America/Goose_Bay': [53.3, -60.42, 'Goose Bay'], 'America/Toronto': [43.65, -79.38, 'Toronto'],
  'America/Montreal': [45.5, -73.57, 'Montreal'], 'America/Nipigon': [49.01, -88.27, 'Nipigon'], 'America/Thunder_Bay': [48.38, -89.25, 'Thunder Bay'],
  'America/Winnipeg': [49.9, -97.14, 'Winnipeg'], 'America/Regina': [50.45, -104.62, 'Regina'], 'America/Swift_Current': [50.29, -107.8, 'Swift Current'],
  'America/Edmonton': [53.55, -113.49, 'Edmonton'], 'America/Vancouver': [49.28, -123.12, 'Vancouver'], 'America/Whitehorse': [60.72, -135.06, 'Whitehorse'],
  'America/Yellowknife': [62.45, -114.37, 'Yellowknife'], 'America/Iqaluit': [63.75, -68.52, 'Iqaluit'], 'America/Dawson_Creek': [55.76, -120.24, 'Dawson Creek'],
  // United States
  'America/New_York': [40.71, -74.01, 'New York'], 'America/Detroit': [42.33, -83.05, 'Detroit'], 'America/Indiana/Indianapolis': [39.77, -86.16, 'Indianapolis'],
  'America/Kentucky/Louisville': [38.25, -85.76, 'Louisville'], 'America/Chicago': [41.88, -87.63, 'Chicago'], 'America/Denver': [39.74, -104.99, 'Denver'],
  'America/Boise': [43.62, -116.2, 'Boise'], 'America/Phoenix': [33.45, -112.07, 'Phoenix'], 'America/Los_Angeles': [34.05, -118.24, 'Los Angeles'],
  'America/Anchorage': [61.22, -149.9, 'Anchorage'], 'America/Juneau': [58.3, -134.42, 'Juneau'], 'Pacific/Honolulu': [21.31, -157.86, 'Honolulu'],
  'America/Puerto_Rico': [18.47, -66.11, 'San Juan'],
  // Mexico, Central America, Caribbean
  'America/Mexico_City': [19.43, -99.13, 'Mexico City'], 'America/Monterrey': [25.69, -100.32, 'Monterrey'], 'America/Tijuana': [32.51, -117.04, 'Tijuana'],
  'America/Cancun': [21.16, -86.85, 'Cancún'], 'America/Guatemala': [14.63, -90.51, 'Guatemala City'], 'America/Costa_Rica': [9.93, -84.08, 'San José'],
  'America/Panama': [8.98, -79.52, 'Panama City'], 'America/Havana': [23.11, -82.37, 'Havana'], 'America/Jamaica': [18.0, -76.79, 'Kingston'],
  'America/Santo_Domingo': [18.49, -69.93, 'Santo Domingo'],
  // South America
  'America/Bogota': [4.71, -74.07, 'Bogotá'], 'America/Caracas': [10.48, -66.9, 'Caracas'], 'America/Lima': [-12.05, -77.04, 'Lima'],
  'America/Guayaquil': [-2.17, -79.92, 'Guayaquil'], 'America/La_Paz': [-16.5, -68.15, 'La Paz'], 'America/Santiago': [-33.45, -70.67, 'Santiago'],
  'America/Argentina/Buenos_Aires': [-34.6, -58.38, 'Buenos Aires'], 'America/Buenos_Aires': [-34.6, -58.38, 'Buenos Aires'], 'America/Montevideo': [-34.9, -56.16, 'Montevideo'],
  'America/Asuncion': [-25.26, -57.58, 'Asunción'], 'America/Sao_Paulo': [-23.55, -46.63, 'São Paulo'], 'America/Manaus': [-3.12, -60.02, 'Manaus'],
  'America/Fortaleza': [-3.73, -38.53, 'Fortaleza'], 'America/Recife': [-8.05, -34.9, 'Recife'],
  // Europe
  'Europe/London': [51.51, -0.13, 'London'], 'Europe/Dublin': [53.35, -6.26, 'Dublin'], 'Europe/Lisbon': [38.72, -9.14, 'Lisbon'],
  'Atlantic/Reykjavik': [64.15, -21.94, 'Reykjavík'], 'Atlantic/Canary': [28.12, -15.43, 'Las Palmas'], 'Europe/Madrid': [40.42, -3.7, 'Madrid'],
  'Europe/Paris': [48.86, 2.35, 'Paris'], 'Europe/Brussels': [50.85, 4.35, 'Brussels'], 'Europe/Amsterdam': [52.37, 4.9, 'Amsterdam'],
  'Europe/Luxembourg': [49.61, 6.13, 'Luxembourg'], 'Europe/Berlin': [52.52, 13.4, 'Berlin'], 'Europe/Zurich': [47.38, 8.54, 'Zürich'],
  'Europe/Vienna': [48.21, 16.37, 'Vienna'], 'Europe/Rome': [41.9, 12.5, 'Rome'], 'Europe/Copenhagen': [55.68, 12.57, 'Copenhagen'],
  'Europe/Oslo': [59.91, 10.75, 'Oslo'], 'Europe/Stockholm': [59.33, 18.07, 'Stockholm'], 'Europe/Helsinki': [60.17, 24.94, 'Helsinki'],
  'Europe/Warsaw': [52.23, 21.01, 'Warsaw'], 'Europe/Prague': [50.08, 14.44, 'Prague'], 'Europe/Budapest': [47.5, 19.04, 'Budapest'],
  'Europe/Belgrade': [44.79, 20.45, 'Belgrade'], 'Europe/Zagreb': [45.81, 15.98, 'Zagreb'], 'Europe/Athens': [37.98, 23.73, 'Athens'],
  'Europe/Bucharest': [44.43, 26.1, 'Bucharest'], 'Europe/Sofia': [42.7, 23.32, 'Sofia'], 'Europe/Kiev': [50.45, 30.52, 'Kyiv'],
  'Europe/Kyiv': [50.45, 30.52, 'Kyiv'], 'Europe/Riga': [56.95, 24.11, 'Riga'], 'Europe/Vilnius': [54.69, 25.28, 'Vilnius'],
  'Europe/Tallinn': [59.44, 24.75, 'Tallinn'], 'Europe/Istanbul': [41.01, 28.98, 'Istanbul'], 'Europe/Moscow': [55.76, 37.62, 'Moscow'],
  'Europe/Minsk': [53.9, 27.56, 'Minsk'], 'Europe/Malta': [35.9, 14.51, 'Valletta'],
  // Africa and the Middle East
  'Africa/Casablanca': [33.57, -7.59, 'Casablanca'], 'Africa/Lagos': [6.52, 3.38, 'Lagos'], 'Africa/Accra': [5.6, -0.19, 'Accra'],
  'Africa/Cairo': [30.04, 31.24, 'Cairo'], 'Africa/Nairobi': [-1.29, 36.82, 'Nairobi'], 'Africa/Addis_Ababa': [9.03, 38.74, 'Addis Ababa'],
  'Africa/Johannesburg': [-26.2, 28.05, 'Johannesburg'], 'Africa/Algiers': [36.75, 3.06, 'Algiers'], 'Africa/Tunis': [36.81, 10.18, 'Tunis'],
  'Asia/Jerusalem': [31.77, 35.21, 'Jerusalem'], 'Asia/Beirut': [33.89, 35.5, 'Beirut'], 'Asia/Amman': [31.95, 35.93, 'Amman'],
  'Asia/Riyadh': [24.71, 46.68, 'Riyadh'], 'Asia/Dubai': [25.2, 55.27, 'Dubai'], 'Asia/Qatar': [25.29, 51.53, 'Doha'], 'Asia/Tehran': [35.69, 51.39, 'Tehran'],
  // Asia
  'Asia/Karachi': [24.86, 67.0, 'Karachi'], 'Asia/Kolkata': [28.61, 77.21, 'New Delhi'], 'Asia/Calcutta': [28.61, 77.21, 'New Delhi'],
  'Asia/Kathmandu': [27.72, 85.32, 'Kathmandu'], 'Asia/Dhaka': [23.81, 90.41, 'Dhaka'], 'Asia/Colombo': [6.93, 79.86, 'Colombo'],
  'Asia/Bangkok': [13.76, 100.5, 'Bangkok'], 'Asia/Ho_Chi_Minh': [10.82, 106.63, 'Ho Chi Minh City'], 'Asia/Jakarta': [-6.21, 106.85, 'Jakarta'],
  'Asia/Kuala_Lumpur': [3.14, 101.69, 'Kuala Lumpur'], 'Asia/Singapore': [1.35, 103.82, 'Singapore'], 'Asia/Manila': [14.6, 120.98, 'Manila'],
  'Asia/Shanghai': [31.23, 121.47, 'Shanghai'], 'Asia/Hong_Kong': [22.32, 114.17, 'Hong Kong'], 'Asia/Taipei': [25.03, 121.57, 'Taipei'],
  'Asia/Seoul': [37.57, 126.98, 'Seoul'], 'Asia/Tokyo': [35.68, 139.69, 'Tokyo'], 'Asia/Almaty': [43.24, 76.89, 'Almaty'],
  'Asia/Tashkent': [41.3, 69.24, 'Tashkent'], 'Asia/Novosibirsk': [55.01, 82.93, 'Novosibirsk'], 'Asia/Vladivostok': [43.12, 131.89, 'Vladivostok'],
  'Asia/Ulaanbaatar': [47.89, 106.91, 'Ulaanbaatar'],
  // Oceania
  'Australia/Perth': [-31.95, 115.86, 'Perth'], 'Australia/Darwin': [-12.46, 130.84, 'Darwin'], 'Australia/Adelaide': [-34.93, 138.6, 'Adelaide'],
  'Australia/Brisbane': [-27.47, 153.03, 'Brisbane'], 'Australia/Sydney': [-33.87, 151.21, 'Sydney'], 'Australia/Melbourne': [-37.81, 144.96, 'Melbourne'],
  'Australia/Hobart': [-42.88, 147.33, 'Hobart'], 'Pacific/Auckland': [-36.85, 174.76, 'Auckland'], 'Pacific/Fiji': [-18.14, 178.44, 'Suva'],
  'Pacific/Guam': [13.44, 144.79, 'Hagåtña'],
};
export function placeFromTimeZone(tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })()) {
  const p = TZ_PLACES[tz]; if (!p) return null;
  return { lat: p[0], lon: p[1], label: `Example: ${p[2]}`, fromTz: tz };
}
