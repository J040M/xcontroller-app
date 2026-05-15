//! SD-card upload validation helpers, extracted from the xcontroller
//! backend's `wscom.rs`. Kept here so the binary-transfer orchestration in
//! `serial.rs` validates exactly like the WebSocket backend does.

use marlin_binary_transfer::file_transfer::Compression;

/// Server-side validation for an upload destination filename. Marlin's SD
/// layer allows up to 64 chars including the NUL terminator, so 63 is the
/// usable cap. We also reject directory separators (no traversal) and
/// require a recognised g-code extension.
pub fn valid_dest_filename(name: &str) -> bool {
    if name.is_empty() || name.len() > 63 {
        return false;
    }
    if name.contains('/') || name.contains('\0') {
        return false;
    }
    let lower = name.to_lowercase();
    lower.ends_with(".gco") || lower.ends_with(".gcode") || lower.ends_with(".g")
}

/// Translate the request's compression string into a `Compression` value,
/// returning `Err(reason)` if the requested mode isn't available in this
/// build. The `heatshrink` feature gates everything except `"none"`.
pub fn resolve_compression(requested: Option<&str>) -> Result<Compression, String> {
    match requested.unwrap_or("none") {
        "none" => Ok(Compression::None),
        "heatshrink" => {
            #[cfg(feature = "heatshrink")]
            {
                Ok(Compression::Heatshrink {
                    window: 8,
                    lookahead: 4,
                })
            }
            #[cfg(not(feature = "heatshrink"))]
            {
                Err("compression unavailable: rebuild with --features heatshrink".into())
            }
        }
        "auto" => {
            #[cfg(feature = "heatshrink")]
            {
                Ok(Compression::Auto)
            }
            #[cfg(not(feature = "heatshrink"))]
            {
                Err("compression auto unavailable: rebuild with --features heatshrink".into())
            }
        }
        other => Err(format!("unknown compression mode: {}", other)),
    }
}

/// Stable string token for a `Compression` value, used in the `UploadDone`
/// payload instead of debug-formatting the enum.
pub fn compression_label(c: &Compression) -> &'static str {
    match c {
        Compression::None => "none",
        Compression::Heatshrink { .. } => "heatshrink",
        Compression::Auto => "auto",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_dest_filename_accepts_canonical_extensions() {
        assert!(valid_dest_filename("part.gco"));
        assert!(valid_dest_filename("PART.GCODE"));
        assert!(valid_dest_filename("a.g"));
        assert!(valid_dest_filename("Some_File-01.GCo"));
    }

    #[test]
    fn valid_dest_filename_rejects_bad_inputs() {
        assert!(!valid_dest_filename(""), "empty rejected");
        assert!(!valid_dest_filename("noext"), "no extension rejected");
        assert!(!valid_dest_filename("foo.txt"), "wrong extension rejected");
        assert!(!valid_dest_filename("foo/bar.gco"), "slash rejected");
        assert!(
            !valid_dest_filename("nul\0byte.gco"),
            "embedded NUL rejected"
        );
        let too_long = format!("{}.gco", "x".repeat(60)); // 60 + 4 = 64 chars
        assert!(!valid_dest_filename(&too_long), ">63 chars rejected");
    }

    #[test]
    fn valid_dest_filename_accepts_63_char_edge() {
        let name = format!("{}.gco", "x".repeat(59)); // 59 + 4 = 63 chars
        assert_eq!(name.len(), 63);
        assert!(valid_dest_filename(&name));
    }

    #[test]
    fn resolve_compression_none_always_works() {
        assert!(matches!(
            resolve_compression(Some("none")),
            Ok(Compression::None)
        ));
        assert!(matches!(resolve_compression(None), Ok(Compression::None)));
    }

    #[test]
    fn resolve_compression_unknown_errors() {
        assert!(resolve_compression(Some("lzma")).is_err());
        assert!(resolve_compression(Some("")).is_err());
    }

    #[cfg(feature = "heatshrink")]
    #[test]
    fn resolve_compression_heatshrink_modes_with_feature() {
        assert!(matches!(
            resolve_compression(Some("heatshrink")),
            Ok(Compression::Heatshrink { .. })
        ));
        assert!(matches!(
            resolve_compression(Some("auto")),
            Ok(Compression::Auto)
        ));
    }

    #[cfg(not(feature = "heatshrink"))]
    #[test]
    fn resolve_compression_heatshrink_modes_without_feature() {
        assert!(resolve_compression(Some("heatshrink")).is_err());
        assert!(resolve_compression(Some("auto")).is_err());
    }

    #[test]
    fn compression_label_maps_every_variant() {
        assert_eq!(compression_label(&Compression::None), "none");
        assert_eq!(
            compression_label(&Compression::Heatshrink {
                window: 8,
                lookahead: 4
            }),
            "heatshrink"
        );
        assert_eq!(compression_label(&Compression::Auto), "auto");
    }
}
