use tauri::command;

#[cfg(target_os = "macos")]
use cocoa::base::{id, nil};
#[cfg(target_os = "macos")]
use cocoa::appkit::NSColor; // Trait for instance methods
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};
#[cfg(target_os = "macos")]
use objc::runtime::Class;

#[command]
pub fn get_system_accent_color() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    unsafe {
        #[allow(deprecated)]
        {
            // Get NSColor class
            let ns_color_class = Class::get("NSColor").ok_or_else(|| "NSColor class not found".to_string())?;
            
            // Call +[NSColor controlAccentColor]
            let accent_color: id = msg_send![ns_color_class, controlAccentColor];
            
            // Get sRGB color space
            let srgb_color_space = cocoa::appkit::NSColorSpace::sRGBColorSpace(nil);
            
            // Convert color
            let srgb_color = accent_color.colorUsingColorSpace_(srgb_color_space);

            if srgb_color == nil {
                return Err("Failed to convert color space".to_string());
            }

            let r: f64 = srgb_color.redComponent();
            let g: f64 = srgb_color.greenComponent();
            let b: f64 = srgb_color.blueComponent();

            let r_u8 = (r * 255.0).round() as u8;
            let g_u8 = (g * 255.0).round() as u8;
            let b_u8 = (b * 255.0).round() as u8;

            Ok(format!("#{:02x}{:02x}{:02x}", r_u8, g_u8, b_u8))
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        // Fallback to blue-600 (#2563eb) which is our current primary
        Ok("#2563eb".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_accent_color_format() {
        let color = get_system_accent_color().unwrap();
        assert!(color.starts_with("#"));
        assert_eq!(color.len(), 7);
        // Verify it contains valid hex chars
        assert!(color.chars().skip(1).all(|c| c.is_digit(16)));
    }
}