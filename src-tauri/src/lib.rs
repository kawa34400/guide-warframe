use tauri::{Manager, WebviewWindow};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

const WINDOW_LABELS: [&str; 3] = ["cycles", "missions", "notes"];

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

fn each_window<F: Fn(&WebviewWindow)>(app: &tauri::AppHandle, f: F) {
    for label in WINDOW_LABELS {
        if let Some(w) = app.get_webview_window(label) {
            f(&w);
        }
    }
}

fn toggle_visibility_all(app: &tauri::AppHandle, state: &VisibilityState) {
    let mut current = state.0.lock().unwrap();
    *current = !*current;
    let want_visible = *current;
    each_window(app, |w| {
        if want_visible {
            let _ = w.show();
        } else {
            let _ = w.hide();
        }
    });
}

fn toggle_click_through_all(app: &tauri::AppHandle, state: &ClickThroughState) {
    let mut current = state.0.lock().unwrap();
    *current = !*current;
    let val = *current;
    each_window(app, |w| {
        let _ = w.set_ignore_cursor_events(val);
    });
}

struct ClickThroughState(std::sync::Mutex<bool>);
struct VisibilityState(std::sync::Mutex<bool>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    log("run() entered");
    tauri::Builder::default()
        .manage(ClickThroughState(std::sync::Mutex::new(false)))
        .manage(VisibilityState(std::sync::Mutex::new(true)))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    let f8 = Shortcut::new(None, Code::F8);
                    let ctrl_f8 = Shortcut::new(Some(Modifiers::CONTROL), Code::F8);

                    if shortcut == &f8 {
                        let state: tauri::State<VisibilityState> = app.state();
                        toggle_visibility_all(app, &state);
                    } else if shortcut == &ctrl_f8 {
                        let state: tauri::State<ClickThroughState> = app.state();
                        toggle_click_through_all(app, &state);
                    }
                })
                .build(),
        )
        .setup(|app| {
            log("setup() entered");
            let f8 = Shortcut::new(None, Code::F8);
            let ctrl_f8 = Shortcut::new(Some(Modifiers::CONTROL), Code::F8);
            let _ = app.global_shortcut().register(f8);
            let _ = app.global_shortcut().register(ctrl_f8);
            log("setup() done");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
