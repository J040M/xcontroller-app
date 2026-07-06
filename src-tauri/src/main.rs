// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod printer_core;
mod serial;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(serial::SerialState::default())
        .invoke_handler(tauri::generate_handler![
            serial::list_serial_ports,
            serial::serial_connect,
            serial::serial_disconnect,
            serial::serial_send_command,
            serial::usb_upload,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
