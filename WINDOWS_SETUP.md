# Windows Setup Guide

## Common Issues and Solutions

### Punycode Deprecation Warning

If you see this warning:
```
(node:24876) [DEP0040] DeprecationWarning: The `punycode` module is deprecated.
```

**This is harmless!** The scraper works fine. This warning comes from a dependency (googleapis or whatsapp-web.js), not our code.

**Solution 1: Use the default start command (warning suppressed):**
```bash
npm start
```

**Solution 2: Suppress manually (if running with `node index.js`):**
```bash
node --no-deprecation index.js
```

**Solution 3: See all warnings (verbose mode):**
```bash
npm run start:verbose
```

## Running on Windows

### Using Command Prompt:
```cmd
npm install
npm start
```

### Using PowerShell:
```powershell
npm install
npm start
```

### Using Git Bash (recommended):
```bash
npm install
npm start
```

## Node.js Version

Make sure you have Node.js 18.0.0 or higher:
```bash
node --version
```

If you need to update Node.js, download from: https://nodejs.org/

## Path Issues

If you see "command not found" errors, make sure Node.js is in your PATH:
1. Open System Properties > Environment Variables
2. Check that `C:\Program Files\nodejs\` is in your PATH
3. Restart your terminal/IDE after changes

## Hebrew Text Display

Windows Terminal and PowerShell support Hebrew text by default. If you see garbled text:
1. Use Windows Terminal (recommended)
2. Or use Git Bash
3. Make sure console font supports Hebrew (Consolas, Courier New)
