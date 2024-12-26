# Xcontroller-App

<img src="https://github.com/J040M/xcontroller-app/.github/logo.png" alt="xcontroller-app Logo" width="200"/>

Desktop/Web application to communicate with [XController](https://github.com/J040M/xcontroller)

## Features

- **Printer Status**: Get live updates on the printer's status, including print progress, temperatures, and more.
- **Movement Control**: Precisely control the movement of your printer's axes directly from the interface.
- **Temperature Graphs**: Monitor and analyze temperature changes of the printer's components in real-time.
- **Terminal**: Send commands to the printer and view live responses via a dedicated terminal.
- **File Listing**: Browse and manage files stored on your 3D printer.
- **Upload files to SD**: Upload files to SD card.
- **Run print jobs**: Run 3D printing job from SD card.
- **GCode Viewer**: Visualize your 3D printing jobs with an integrated GCode viewer.

## Development

To run start by installing NodeJS and Rust. 

Run the app locally on browser
``` npm install && npm run dev```

## Build from source

Build Vue app

``` npm run build```

Build Tauri app
``` npm run tauri build```

For more information regarding build check [Tauri](https://v2.tauri.app/distribute/)
