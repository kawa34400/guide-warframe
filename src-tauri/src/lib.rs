use tauri::{Manager, PhysicalPosition, PhysicalSize, WebviewWindow};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn log(msg: &str) {
    use std::io::Write;
    let path = dirs_next::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("guide-warframe-overlay")
        .join("crash.log");
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&path) {
        let now = chrono::Local::now().to_rfc3339();
        let _ = writeln!(f, "[{now}] {msg}");
    }
}

fn toggle_visibility(window: &WebviewWindow) {
    let visible = window.is_visible().unwrap_or(false);
    if visible {
        let _ = window.hide();
    } else {
        let _ = window.show();
    }
}

fn cycle_corner(window: &WebviewWindow, state: &CornerState) {
    let mut current = state.0.lock().unwrap();
    *current = (*current + 1) % 4;
    let corner = *current;
    let monitor = match window.current_monitor() {
        Ok(Some(m)) => m,
        _ => return,
    };
    let scale = monitor.scale_factor();
    let mon_size = monitor.size();
    let mon_pos = monitor.position();

    let win_size = window.outer_size().unwrap_or(PhysicalSize::new(280, 60));
    let margin: u32 = (20.0 * scale) as u32;

    let (x, y) = match corner {
        0 => (mon_pos.x + margin as i32, mon_pos.y + margin as i32),
        1 => (
            mon_pos.x + mon_size.width as i32 - win_size.width as i32 - margin as i32,
            mon_pos.y + margin as i32,
        ),
        2 => (
            mon_pos.x + mon_size.width as i32 - win_size.width as i32 - margin as i32,
            mon_pos.y + mon_size.height as i32 - win_size.height as i32 - margin as i32,
        ),
        _ => (
            mon_pos.x + margin as i32,
            mon_pos.y + mon_size.height as i32 - win_size.height as i32 - margin as i32,
        ),
    };
    let _ = window.set_position(PhysicalPosition::new(x, y));
}

struct ClickThroughState(std::sync::Mutex<bool>);
struct CornerState(std::sync::Mutex<u32>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    log("run() entered");
    tauri::Builder::default()
        .manage(ClickThroughState(std::sync::Mutex::new(false)))
        .manage(CornerState(std::sync::Mutex::new(1))) // start top-right
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    let Some(window) = app.get_webview_window("main") else {
                        return;
                    };

                    let f8 = Shortcut::new(None, Code::F8);
                    let ctrl_f8 = Shortcut::new(Some(Modifiers::CONTROL), Code::F8);
                    let shift_f8 = Shortcut::new(Some(Modifiers::SHIFT), Code::F8);

                    if shortcut == &f8 {
                        toggle_visibility(&window);
                    } else if shortcut == &ctrl_f8 {
                        let state: tauri::State<ClickThroughState> = app.state();
                        let mut current = state.0.lock().unwrap();
                        *current = !*current;
                        let _ = window.set_ignore_cursor_events(*current);
                    } else if shortcut == &shift_f8 {
                        let state: tauri::State<CornerState> = app.state();
                        cycle_corner(&window, &state);
                    }
                })
                .build(),
        )
        .setup(|app| {
            log("setup() entered");
            let f8 = Shortcut::new(None, Code::F8);
            let ctrl_f8 = Shortcut::new(Some(Modifiers::CONTROL), Code::F8);
            let shift_f8 = Shortcut::new(Some(Modifiers::SHIFT), Code::F8);
            let _ = app.global_shortcut().register(f8);
            let _ = app.global_shortcut().register(ctrl_f8);
            let _ = app.global_shortcut().register(shift_f8);
            log("setup() done");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
