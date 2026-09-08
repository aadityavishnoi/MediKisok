/**
 * Generates high-fidelity clinical document images (Prescriptions, Lab Reports, ABHA cards)
 * on a browser canvas for instant zero-dependency testing and evaluation.
 */
export function createSampleClinicalDocument(type: 'prescription' | 'lab' | 'id' = 'prescription'): string {
  if (typeof document === 'undefined') return 'data:image/jpeg;base64,sample';

  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'data:image/jpeg;base64,sample';

  // Background - medical paper tone
  ctx.fillStyle = '#fbfbfd';
  ctx.fillRect(0, 0, 1000, 1400);

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 940, 1340);

  if (type === 'lab') {
    // Header
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(30, 30, 940, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('APEX DIAGNOSTIC PATHOLOGY LAB', 70, 95);

    ctx.font = '18px Arial, sans-serif';
    ctx.fillText('NABL Accredited • ISO 15189 Certified • 24x7 Diagnostic Services', 70, 125);

    // Patient Info
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('PATIENT: Registered OPD Patient', 70, 200);
    ctx.fillText('AGE / GENDER: 34 Y / M', 550, 200);
    ctx.fillText('DATE: ' + new Date().toLocaleDateString('en-IN'), 70, 240);
    ctx.fillText('SAMPLE: Whole Blood (EDTA)', 550, 240);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 270);
    ctx.lineTo(930, 270);
    ctx.stroke();

    // Table Header
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(70, 290, 860, 45);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('INVESTIGATION / TEST', 90, 320);
    ctx.fillText('RESULT', 460, 320);
    ctx.fillText('REFERENCE RANGE', 680, 320);

    // Test Rows
    const tests = [
      { name: 'Hemoglobin (Hb)', result: '13.8 g/dL', normal: '13.0 - 17.0 g/dL' },
      { name: 'Total Leukocyte Count (TLC)', result: '7,400 /mcL', normal: '4,000 - 11,000 /mcL' },
      { name: 'Platelet Count', result: '245,000 /mcL', normal: '150,000 - 450,000 /mcL' },
      { name: 'Random Blood Sugar (RBS)', result: '108 mg/dL', normal: '70 - 140 mg/dL' },
      { name: 'Serum Creatinine', result: '0.92 mg/dL', normal: '0.7 - 1.3 mg/dL' },
      { name: 'Blood Urea Nitrogen (BUN)', result: '16 mg/dL', normal: '7 - 20 mg/dL' },
      { name: 'Total Bilirubin', result: '0.8 mg/dL', normal: '0.2 - 1.2 mg/dL' },
    ];

    let y = 380;
    tests.forEach((t) => {
      ctx.fillStyle = '#1e293b';
      ctx.font = '19px Arial, sans-serif';
      ctx.fillText(t.name, 90, y);
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText(t.result, 460, y);
      ctx.font = '17px Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(t.normal, 680, y);
      y += 55;
    });

    // Signature
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillText('Dr. S. K. Roy, MD (Pathology)', 620, 1200);
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText('Consultant Pathologist', 620, 1230);
  } else if (type === 'id') {
    // ABHA Card
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(30, 30, 940, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText('AYUSHMAN BHARAT DIGITAL MISSION', 70, 85);
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText('National Health Authority • Government of India', 70, 120);

    // Card Box
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(100, 250, 800, 520, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('ABHA CARD (Health ID)', 150, 320);

    ctx.fillStyle = '#334155';
    ctx.font = '22px Arial, sans-serif';
    ctx.fillText('Name: Registered Patient', 150, 390);
    ctx.fillText('Gender: Male', 150, 440);
    ctx.fillText('Year of Birth: 1990', 150, 490);
    ctx.fillText('ABHA Address: patient.care@abdm', 150, 540);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('91-8472-9102-4819', 150, 640);
  } else {
    // Prescription
    // Header
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(30, 30, 940, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('CITY CARE MULTISPECIALITY CLINIC', 70, 85);
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText('Dr. Ananya Sen, MBBS, MD (General Medicine) • Reg: MCI-58291', 70, 120);

    // Patient info banner
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('Patient Name: OPD Check-In', 70, 210);
    ctx.fillText('Age: 32 Y / Male', 550, 210);
    ctx.fillText('Date: ' + new Date().toLocaleDateString('en-IN'), 70, 250);
    ctx.fillText('Vitals: BP 120/80 • SpO2 98%', 550, 250);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 280);
    ctx.lineTo(930, 280);
    ctx.stroke();

    // Rx Symbol
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText('℞', 70, 360);

    // Diagnosis
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('Diagnosis: Acute Upper Respiratory Tract Infection (URTI)', 140, 350);

    // Medicines List
    const meds = [
      { name: '1. Tab. Paracetamol 500 mg', dose: '1 tablet BD (After meals) x 5 days' },
      { name: '2. Tab. Pantoprazole 40 mg', dose: '1 tablet OD (Empty stomach) x 5 days' },
      { name: '3. Syp. Cough Relief 10 ml', dose: '10 ml TDS (After meals) x 3 days' },
      { name: '4. Tab. Cetirizine 10 mg', dose: '1 tablet HS (At bedtime) x 3 days' },
    ];

    let y = 430;
    meds.forEach((m) => {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText(m.name, 90, y);
      ctx.fillStyle = '#475569';
      ctx.font = '19px Arial, sans-serif';
      ctx.fillText(m.dose, 120, y + 32);
      y += 90;
    });

    // Instructions
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('General Advice & Instructions:', 90, 840);
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('• Warm saline gargles twice daily', 110, 880);
    ctx.fillText('• Steam inhalation morning and evening', 110, 915);
    ctx.fillText('• Plenty of warm fluids; avoid chilled items', 110, 950);

    // Doctor Signature
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText('Dr. Ananya Sen', 680, 1200);
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText('Consultant Physician', 680, 1230);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
