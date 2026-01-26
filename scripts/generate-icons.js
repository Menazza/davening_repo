// Simple script to generate PWA icons
// This creates basic icon files - you can replace these with custom designs later

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">PT</text>
</svg>`;
};

// For now, we'll create SVG files and note that they need to be converted to PNG
// In production, you should use proper PNG files
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create SVG icons (these will work but PNG is preferred for PWA)
fs.writeFileSync(path.join(publicDir, 'icon.svg'), createSVGIcon(512));

console.log('Icon SVG created. For full PWA support, convert to PNG:');
console.log('1. Use an online tool like https://cloudconvert.com/svg-to-png');
console.log('2. Or use ImageMagick: convert icon.svg -resize 192x192 icon-192.png');
console.log('3. Create icon-192.png and icon-512.png in the public directory');
