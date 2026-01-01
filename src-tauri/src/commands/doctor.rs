use crate::models::DoctorReport;
use crate::services::run_doctor as run_doctor_service;

/// Run environment doctor check and return report
#[tauri::command]
pub fn run_doctor() -> DoctorReport {
    run_doctor_service()
}
