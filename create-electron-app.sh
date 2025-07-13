#!/bin/bash

# Create Electron-based Mac app for Memory Friend
APP_NAME="Memory Friend"
APP_DIR="$HOME/Desktop/claude projects/task-manager"

echo "Creating Electron app: $APP_NAME"

# Create electron app structure
mkdir -p "$APP_DIR/electron-app"
cd "$APP_DIR/electron-app"

# Create package.json for Electron
cat > package.json << 'EOF'
{
  "name": "memory-friend-electron",
  "version": "1.0.0",
  "description": "Memory Friend - Conversational AI Assistant",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "dist": "npm run build"
  },
  "build": {
    "appId": "com.memoryfriend.app",
    "productName": "Memory Friend",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*",
      "!dist/**/*"
    ],
    "mac": {
      "icon": "assets/icon.icns",
      "category": "public.app-category.productivity"
    }
  },
  "devDependencies": {
    "electron": "^27.0.0",
    "electron-builder": "^24.6.4"
  }
}
EOF

# Create main.js for Electron
cat > main.js << 'EOF'
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    titleBarStyle: 'hiddenInset',
    show: false
  });

  // Load the web app
  const isDev = process.env.NODE_ENV === 'development';
  const url = isDev ? 'http://localhost:3000' : 'https://your-memory-friend-url.vercel.app';
  
  mainWindow.loadURL(url);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Create menu
const template = [
  {
    label: 'Memory Friend',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
EOF

# Create assets directory
mkdir -p assets

echo "Electron app structure created!"
echo "To build the app:"
echo "1. cd '$APP_DIR/electron-app'"
echo "2. npm install"
echo "3. npm run build"
echo "4. Your app will be in the 'dist' folder"
EOF

chmod +x "$APP_DIR/create-electron-app.sh"