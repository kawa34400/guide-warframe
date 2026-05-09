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

fn toggle_click_through(window: &WebviewWindow, state: &ClickThroughState) {
    let mut current = state.0.lock().unwrap();
    *current = !*current;
    let _ = window.set_ignore_cursor_events(*current);
    // Visual hint: when click-through is on, lower opacity so user knows
    // (we can't read the current state via Tauri reliably across platforms).
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

                    // F8: toggle visibility
                    let f8 = Shortcut::new(None, Code::F8);
                    if shortcut == &f8 {
                        toggle_visibility(&window);
                        return;
                    }

                    // Ctrl+F8: toggle click-through
                    let ctrl_f8 = Shortcut::new(Some(Modifiers::CONTROL), Code::F8);
                    if shortcut == &ctrl_f8 {
                        let state: tauri::State<ClickThroughState> = app.state();
                        toggle_click_through(&window, &state);
                        return;
                    }
                })
                .build(),
        )
        .setup(|app| {
            let f8 = Shortcut::new(None, Code::F8);
            let ctrl_f8 = Shortcut::new(Some(Modifiers::CONTROL), Code::F8);
            app.global_shortcut().register(f8)?;
            app.global_shortcut().register(ctrl_f8)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
