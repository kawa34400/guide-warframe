use tauri::{Manager, WebviewWindow};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn toggle_visibility(window: &WebviewWindow) {
    let visible = window.is_visible().unwrap_or(false);
    if visible {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

struct ClickThroughState(std::sync::Mutex<bool>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ClickThroughState(std::sync::Mutex::new(false)))
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

                    if shortcut == &f8 {
                        toggle_visibility(&window);
                    } else if shortcut == &ctrl_f8 {
                        let state: tauri::State<ClickThroughState> = app.state();
                        let mut current = state.0.lock().unwrap();
                        *current = !*current;
                        let _ = window.set_ignore_cursor_events(*current);
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Best-effort hotkey registration; ignore errors so the app still
            // launches if F8 is already taken by another process.
            let f8 = Shortcut::new(None, Code::F8);
            let ctrl_f8 = Shortcut::new(Some(Modifiers::CONTROL), Code::F8);
            let _ = app.global_shortcut().register(f8);
            let _ = app.global_shortcut().register(ctrl_f8);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
