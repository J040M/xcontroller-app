# Xcontroller-App

<img src=".github/logo.png" alt="xcontroller-app Logo" width="300" style="max-width: 100%;display: block;margin-left: auto;margin-right: auto;"
  />

Desktop/Web application to communicate with [XController](https://github.com/J040M/xcontroller)

## Features

- [x] **Movement Control**: Precisely control the movement of your printer's axes directly from the interface.
- [x] **3D position viewer**: Visualize toll movement in 3D space
- [x] **Temperature Graphs**: Monitor and analyze temperature changes of the printer's components in real-time.
- [x] **Terminal**: Send commands to the printer and view live responses via a dedicated terminal.
- [x] **File Listing**: Browse and manage files stored on your 3D printer.
- [x] **Run print jobs**: Run 3D printing job from SD card.
- [x] **Printer Status**: Get live updates on the printer's status, including print progress, and more.
- [ ] **Upload files to SD**: Upload files to SD card.
- [ ] **GCode Viewer**: Visualize your 3D printing jobs with an integrated GCode viewer.

## Development

Run the app locally on browser
```npm install && npm run dev```

## Build from source

Build Vue app
```npm run build```
Build Tauri app
```npm run tauri build```

For more information regarding build check [Tauri](https://v2.tauri.app/distribute/)
