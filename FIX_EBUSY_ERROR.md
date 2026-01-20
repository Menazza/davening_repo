# Fixing EBUSY Errors (OneDrive File Locking)

The `EBUSY: resource busy or locked` errors you're seeing are caused by OneDrive trying to sync the `.next` build directory while Next.js is also accessing those files.

## Quick Fix Options

### Option 1: Exclude `.next` from OneDrive Sync (Recommended)

1. Right-click on the `.next` folder in File Explorer
2. Select **Properties**
3. Go to the **Attributes** section
4. Check **"Hidden"** (optional, but helps)
5. In OneDrive settings:
   - Open OneDrive settings (click OneDrive icon in system tray → Settings)
   - Go to **Sync and backup** → **Advanced settings**
   - Click **Choose folders** and ensure the project folder is synced
   - Or use **Files On-Demand** to reduce sync conflicts

### Option 2: Move Project Outside OneDrive (Best Long-term Solution)

Move your project to a location outside OneDrive, such as:
- `C:\Projects\Hendler daven`
- `C:\Dev\Hendler daven`
- `D:\Projects\Hendler daven` (if you have another drive)

### Option 3: Use OneDrive Files On-Demand

1. Right-click OneDrive icon in system tray
2. Settings → Sync and backup → Advanced settings
3. Enable **"Files On-Demand"**
4. Right-click `.next` folder → **Free up space** (makes it online-only)

### Option 4: Add to Windows Defender/Antivirus Exclusions

1. Open Windows Security
2. Virus & threat protection → Manage settings
3. Add exclusions → Folder
4. Add the `.next` folder

## Note

These errors are **non-critical** - your app will still work. They're just warnings about file locking. The app is functioning correctly as you can see from the successful GET requests (200 status codes).

## Temporary Workaround

If you need immediate relief, you can:
1. Stop the dev server (Ctrl+C)
2. Delete the `.next` folder
3. Restart the dev server

The errors will return once OneDrive starts syncing again, but this gives you a clean start.
