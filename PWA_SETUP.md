# PWA Setup Instructions

Your app is now configured as a Progressive Web App (PWA) that can be installed on mobile devices!

## What's Been Set Up

1. ✅ Manifest file (`app/manifest.ts`) - Defines app metadata
2. ✅ Service Worker (`public/sw.js`) - Enables offline functionality
3. ✅ PWA meta tags in layout - Makes the app installable
4. ✅ Service worker registration - Automatically registers on load

## Generate Icons

To complete the setup, you need to create icon files:

### Option 1: Use the HTML Generator (Easiest)

1. Open `scripts/create-pwa-icons.html` in your browser
2. Click "Generate & Download 192x192" 
3. Click "Generate & Download 512x512"
4. Move both downloaded files to the `public` directory

### Option 2: Use Online Tools

1. Create or find an icon image (512x512 recommended)
2. Use an online tool like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
3. Generate 192x192 and 512x512 versions
4. Save as `icon-192.png` and `icon-512.png` in the `public` directory

### Option 3: Use ImageMagick (if installed)

```bash
convert icon.svg -resize 192x192 public/icon-192.png
convert icon.svg -resize 512x512 public/icon-512.png
```

## Testing PWA Installation

### On Android (Chrome):

1. Open your deployed app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen" or "Install app"
4. The app will appear on your home screen

### On iOS (Safari):

1. Open your deployed app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. The app will appear on your home screen

### On Desktop (Chrome/Edge):

1. Look for the install icon in the address bar
2. Click it to install the app
3. The app will open in its own window

## Features Enabled

- ✅ **Installable**: Can be added to home screen
- ✅ **Offline Support**: Basic caching for offline access
- ✅ **App-like Experience**: Opens in standalone mode (no browser UI)
- ✅ **Theme Color**: Matches your app's blue theme (#2563eb)

## Customization

You can customize the PWA by editing:

- `app/manifest.ts` - App name, colors, display mode
- `public/sw.js` - Caching strategy and offline behavior
- `app/layout.tsx` - Meta tags and theme colors

## Notes

- The app must be served over HTTPS for PWA features to work (Vercel provides this automatically)
- Service worker only works in production builds
- Icons should be square PNG files for best compatibility
