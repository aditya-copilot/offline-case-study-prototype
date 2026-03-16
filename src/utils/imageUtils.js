const BASE_IMAGE_URL = 'https://imgd.aeplcdn.com/0x0';

export const getVehicleImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/products/')) return imagePath;
  if (imagePath.startsWith('/')) return `${BASE_IMAGE_URL}${imagePath}`;
  return `${BASE_IMAGE_URL}/${imagePath}`;
};

export const FALLBACK_VEHICLE_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f1f5f9"/>
        <stop offset="100%" style="stop-color:#e2e8f0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bg)" rx="12"/>
    <text x="50%" y="45%" font-size="80" text-anchor="middle" fill="#64748b">🏍️</text>
    <text x="50%" y="70%" font-size="14" text-anchor="middle" fill="#64748b" font-family="system-ui">Image temporarily unavailable</text>
  </svg>
`);

export const getLocalImagePath = (imagePath) => {
  if (!imagePath) return null;
  const filename = imagePath.split('/').pop()?.split('?')[0];
  if (!filename) return null;
  return `/products/bikes/${filename}`;
};
