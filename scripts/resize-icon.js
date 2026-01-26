// Script to resize icon.png to required PWA sizes
const fs = require('fs');
const path = require('path');

// Try to use sharp if available, otherwise provide instructions
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not found. Installing sharp...');
  console.log('Please run: npm install sharp --save-dev');
  console.log('Then run this script again.');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const iconPath = path.join(publicDir, 'icon.png');
const icon192Path = path.join(publicDir, 'icon-192.png');
const icon512Path = path.join(publicDir, 'icon-512.png');

if (!fs.existsSync(iconPath)) {
  console.error('Error: icon.png not found in public directory');
  process.exit(1);
}

async function resizeIcons() {
  try {
    console.log('Resizing icon.png to 192x192...');
    await sharp(iconPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(icon192Path);
    
    console.log('Resizing icon.png to 512x512...');
    await sharp(iconPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(icon512Path);
    
    console.log('✅ Successfully created icon-192.png and icon-512.png');
  } catch (error) {
    console.error('Error resizing icons:', error);
    process.exit(1);
  }
}

resizeIcons();
