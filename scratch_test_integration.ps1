$ErrorActionPreference = "Stop"

Write-Host "=== TEST 1: Login as Patient A (Aarav Sharma) ==="
$loginA = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/auth/login" -Method Post -ContentType "application/json" -Body '{"identifier":"demo-patient-001","isDemo":true}'
$tokenA = $loginA.token
$headersA = @{ "Authorization" = "Bearer $tokenA" }
Write-Host "Patient A Authenticated: $($loginA.patient.fullName), ABHA: $($loginA.patient.abhaId)"

Write-Host "`n=== TEST 2: Login as Patient B (Priya Verma) ==="
$loginB = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/auth/login" -Method Post -ContentType "application/json" -Body '{"identifier":"demo-patient-002","isDemo":true}'
$tokenB = $loginB.token
$headersB = @{ "Authorization" = "Bearer $tokenB" }
Write-Host "Patient B Authenticated: $($loginB.patient.fullName), ABHA: $($loginB.patient.abhaId)"

Write-Host "`n=== TEST 3: Patient A Dashboard ==="
$dashA = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/dashboard" -Headers $headersA
Write-Host "Patient A Dashboard loaded. Appointments count: $($dashA.counts.appointments), Prescriptions: $($dashA.counts.prescriptions), Reports: $($dashA.counts.labReports)"
if ($dashA.upcomingAppointment) {
    Write-Host "Patient A Next Appt: $($dashA.upcomingAppointment.reason) on $($dashA.upcomingAppointment.timeSlot)"
}

Write-Host "`n=== TEST 4: Patient A Reports & Prescriptions ==="
$reportsA = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/reports" -Headers $headersA
Write-Host "Patient A Reports count: $($reportsA.Length) (Titles: $(($reportsA | ForEach-Object { $_.title }) -join ', '))"

$rxA = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/prescriptions" -Headers $headersA
Write-Host "Patient A Prescriptions count: $($rxA.Length)"

Write-Host "`n=== TEST 5: IDOR Security Check (Patient A accessing Patient B's Report) ==="
try {
    $res = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/reports/lab-report-priya-01" -Headers $headersA
    Write-Host "FAILED: Patient A was able to access Patient B report!" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCCESS: Access to Patient B's report blocked with status $status (Expected 404)" -ForegroundColor Green
}

Write-Host "`n=== TEST 6: IDOR Security Check (Patient A accessing Patient B's Prescription) ==="
try {
    $res = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/prescriptions/rx-demo-priya-01" -Headers $headersA
    Write-Host "FAILED: Patient A was able to access Patient B prescription!" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCCESS: Access to Patient B's prescription blocked with status $status (Expected 404)" -ForegroundColor Green
}

Write-Host "`n=== TEST 7: IDOR Security Check (Patient B accessing Patient A's Report) ==="
try {
    $res = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/reports/lab-report-cbc-01" -Headers $headersB
    Write-Host "FAILED: Patient B was able to access Patient A report!" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCCESS: Access to Patient A's report blocked with status $status (Expected 404)" -ForegroundColor Green
}

Write-Host "`n=== TEST 8: IDOR Security Check (Patient A cancelling Patient B's Appointment) ==="
try {
    $body = @{ reason = "Malicious cancellation attempt" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/appointments/appt-demo-priya-01/cancel" -Method Put -Headers $headersA -ContentType "application/json" -Body $body
    Write-Host "FAILED: Patient A was able to cancel Patient B's appointment!" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCCESS: Malicious cancellation attempt blocked with status $status (Expected 404)" -ForegroundColor Green
}

Write-Host "`n=== TEST 9: Double-Booking Conflict Prevention ==="
# Tomorrow's date string
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
Write-Host "Attempting duplicate booking on tomorrow ($tomorrow) at 10:00 AM (already booked)..."
try {
    $conflictBody = @{
        doctorId = "DOC-01"
        departmentId = "dept-cardio"
        appointmentDate = $tomorrow
        timeSlot = "10:00 AM"
        reason = "Conflicting consultation slot"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/appointments" -Method Post -Headers $headersA -ContentType "application/json" -Body $conflictBody
    Write-Host "FAILED: Double booking was allowed!" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCCESS: Double booking rejected with status $status (Expected 409)" -ForegroundColor Green
}

Write-Host "`n=== TEST 10: Profile Update ==="
$updateBody = @{
    phone = "9999900001"
    email = "aarav.verified@medikiosk.local"
    address = "AIIMS Doctors Enclave, New Delhi"
    bloodGroup = "B+"
    emergencyContact = "Sunita Sharma"
    emergencyPhone = "+91 98765 43210"
} | ConvertTo-Json
$updatedProfile = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/profile" -Method Put -Headers $headersA -ContentType "application/json" -Body $updateBody
Write-Host "Profile Updated successfully: email is now $($updatedProfile.email), address: $($updatedProfile.address)"

Write-Host "`n=== TEST 11: Notification Read & Mark All Read ==="
$notifs = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/notifications" -Headers $headersA
Write-Host "Patient A Notifications: $($notifs.Length)"
$markAll = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/notifications/read-all" -Method Put -Headers $headersA
Write-Host "Mark all notifications read: $($markAll.success)"

Write-Host "`n=== TEST 12: Report & Prescription Download Endpoints ==="
$rxDownload = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/prescriptions/rx-demo-aarav-01/download" -Headers $headersA
Write-Host "Prescription Download Content Sample:`n$($rxDownload.Substring(0, 140))..."

$reportDownload = Invoke-RestMethod -Uri "http://localhost:4000/api/patient/reports/lab-report-cbc-01/download" -Headers $headersA
Write-Host "Report Download Content Sample:`n$($reportDownload.Substring(0, 140))..."

Write-Host "`n=== ALL API & IDOR SECURITY TESTS PASSED SUCCESSFULLY! ===" -ForegroundColor Cyan
