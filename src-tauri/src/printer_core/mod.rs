//! Printer protocol + serial transport logic, vendored from the xcontroller
//! backend (https://github.com/J040M/xcontroller, `src/`). Keeping these
//! modules close to verbatim copies means a parser/protocol fix only has to
//! be ported across once — the only edits applied here are `use`-path fixes
//! and a `Clone` derive needed by Tauri's event emitter.
//!
//! - `commands.rs`  — the G/M/T command allow-list (verbatim)
//! - `parser.rs`    — M-code response parsers (verbatim, `use` path adjusted)
//! - `serialcom.rs` — the blocking serial connection (verbatim)
//! - `structs.rs`   — shared data structs (verbatim + `Clone` on `MessageSender`)
//! - `upload.rs`    — SD-upload validation helpers, extracted from `wscom.rs`
//!
//! `dead_code` is allowed module-wide: this is a vendored copy and not every
//! item (e.g. the WebSocket-server-only structs) is exercised by the app.
#![allow(dead_code)]

pub mod commands;
pub mod parser;
pub mod serialcom;
pub mod structs;
pub mod upload;
