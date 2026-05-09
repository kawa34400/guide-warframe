// Prevents additional console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::OpenOptions;
use std::io::Write;
use std::panic;

fn log_path() -> std::path::PathBuf {
    let base = dirs_next::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."));
    base.join("guide-warframe-overlay").join("crash.log")
}

fn install_panic_hook() {
    panic::set_hook(Box::new(|info| {
        let path = log_path();
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(mut f) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
        {
            let now = chrono::Local::now().to_rfc3339();
            let _ = writeln!(f, "[{now}] PANIC {info}");
        }
    }));
}

fn main() {
    install_panic_hook();

    // Write a heartbeat so we know the binary at least started, even if Tauri crashes.
    let path = log_path();
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&path) {
        let now = chrono::Local::now().to_rfc3339();
        let _ = writeln!(f, "[{now}] startup begin");
    }

    guide_warframe_overlay_lib::run();
}
