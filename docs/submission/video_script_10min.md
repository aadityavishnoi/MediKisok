# MediKiosk - 10-minute YouTube video script (Team CODEBLOOM 2.0, SIH 2026, PS 26047)

Narration is written to be spoken. Lines starting with SHOW: are what is on screen. Lines starting with SAY: are your voice.
Pace: about 140 words per minute. Where the screen is busy, pause and let the demo breathe. Cut all loading and typing time.

---

## PART 1 - THE FIRST 2 MINUTES (this decides whether people stay)

### 0:00 - 0:20  Cold open (no logo, no intro)
SHOW: Black screen. White text appears: "2 minutes." A clock ticks. Then a crowded OPD photo or stock footage.
SAY: "In a big government hospital in India, the doctor you are about to see may have two minutes for you. Two minutes. In that time they must hear your whole story, read your old reports, examine you, and write a prescription. And behind you, there are thousands of other patients waiting."

### 0:20 - 0:50  Three problems, fast
SHOW: Three quick cuts: (1) a doctor scribbling, patient talking fast; (2) a crumpled handwritten prescription photo; (3) a waiting-room queue.
SAY: "Three things break. One: the history gets rushed, and a good history is where most diagnoses come from. Two: patients carry crumpled papers from five different clinics, in no order. Three: someone with chest pain waits in the same line as someone with a cough. We are Team CODEBLOOM 2.0 from Galgotias University, and we built MediKiosk to fix all three before the patient even enters the consultation room."

### 0:50 - 2:00  The wow moment (live, split screen)
SHOW: Split screen. LEFT = patient kiosk. RIGHT = doctor dashboard on the OPD Queue page. Subtitles on.
Setup: use demo patient Ramesh Patel, 62 (card DEMO-RFID-003), or a card you enrolled in the RFID portal.
1. Tap the RFID card on the Arduino reader (or press the simulate-scan button; do not call it hardware if simulated). Kiosk greets the patient.
2. Cut quickly through language and consent (2 seconds each).
3. Tap "Chest pain". Answer: started less than 1 hour ago, pressure/crushing, severity 7-10, spreads to arm: yes, shortness of breath: tick.
4. Kiosk shows the red emergency banner. RIGHT screen: alert appears, patient jumps to the top with a critical badge.

SAY (over the demo): "Meet Ramesh, sixty-two. He taps his card. The card holds only a random number, never any health data. He picks his language, hears and agrees to consent, and taps 'chest pain'. Now watch. Severe pain, spreading to the arm, and shortness of breath. On the left, the kiosk tells him to alert staff. On the right, look: the doctor's queue just re-ordered. Ramesh is now at the top, marked critical. And here is the important part: no AI guessed this. A hard-coded medical rule caught it, so it is instant and predictable."

SAY (bridge, on camera or voiceover): "That took about a minute, and it can save a life. But MediKiosk does far more. In the next eight minutes I will show you every app in the system, what works today, and what comes next. Stay with me."

---

## PART 2 - THE FULL TOUR

### 2:00 - 2:50  The map: seven apps, one platform
SHOW: The landing page with launch cards, then slide 3 (architecture) from the idea deck, then a quick shot of the Arduino RFID reader on your desk.
SAY: "Here is the whole system. Seven apps talk to one backend. In the waiting room: the Patient Kiosk. In the consultation room: the Doctor Dashboard. To issue cards: the RFID Portal. For hospital and national operations: the Hospital Admin and Central Admin. And for the patient at home: a Patient Portal on the web and an Android app. Everything is connected live with WebSockets, which is why the doctor's screen reacted instantly. And the reader on my desk is an Arduino Nano with an RFID module, low-cost, off-the-shelf hardware."

### 2:50 - 5:10  App 1 - Patient Kiosk (screen-record the full flow)
Order on screen: Identify > Language > Consent > Complaint > History > Vitals > Scan documents.

**Identify (2:50 - 3:20)**
SHOW: Identify screen. Show (a) card tap, (b) "register new patient" with name and mobile, then the OTP step.
SAY: "There are three ways in. Tap a registered card. Or, for a new patient, register with a mobile number and verify with an SMS OTP; the card then gets linked to them. The card never stores a name or a diagnosis, only a random ID, so a lost card leaks nothing."

**Language and consent (3:20 - 3:50)**
SHOW: Language grid in native scripts; switch the UI to Hindi or Tamil. Consent screen: press the speaker button so it reads aloud; press I Agree.
SAY: "Thirteen Indian languages, shown in their own scripts, so nobody has to read English to find theirs. Consent is read aloud for low-literacy patients. And nothing clinical is collected until consent is recorded; the server refuses history and document requests without it, and the decision is written to an audit log."

**History (3:50 - 4:30)**
SHOW: Complaint icon cards, then a question. Press the mic and answer one question by voice, tap the next one. Then toggle AYUSH mode and show a Prakriti question.
SAY: "Big icon cards for the main complaint. Then the interview adapts: chest pain asks about onset, location, character, severity and radiation, the way a doctor would. Every question can be spoken or tapped. If the browser can't hear you, touch always works. And for Ayurvedic OPDs, switch on AYUSH mode and the interview extends to Prakriti, Vikriti, Sara, Samhanana and the rest of the Dashavidha Pariksha."

**Vitals (4:30 - 4:45)**
SHOW: Vitals screen.
SAY: "This screen is built for a vitals pod. In this prototype the readings are simulated or entered manually; connecting real BP and oxygen sensors is on our roadmap."

**Scan documents (4:45 - 5:10)**
SHOW: Point a real prescription at the camera (phone as camera works), capture, and show the extracted medicines and doses appear with a "needs verification" tag.
SAY: "Now the old paper. The patient photographs a prescription or lab report. The system reads it and pulls out medicines, doses and lab values. Everything the machine reads is marked 'needs verification', so the doctor is never asked to blindly trust it, and the original photo is kept as proof."

### 5:10 - 7:30  App 2 - Doctor Dashboard
SHOW: Login with demo.doctor@medikiosk.local / demo (demo account; do not show any .env or database screens).
Sidebar: OPD Queue, Red Flags, Consultations, Patient Records.

**Queue and alerts (5:10 - 5:50)**
SHOW: OPD Queue with risk badges; then the Red Flags page (Red Flags & Emergency Alerts); point at the button that broadcasts an audio chime to the kiosk. If you tap a card while this is open, show the live RFID notification.
SAY: "This is what the doctor sees. A live queue sorted by risk, not just arrival time. A dedicated Red Flags page for emergencies, where staff can acknowledge alerts and even ring a chime at the kiosk. When a card is tapped, the doctor's screen is notified instantly."

**Summary and documents (5:50 - 6:30)**
SHOW: Open a patient's session. Show the structured history (chief complaint, HPI, and so on), then the summary draft with Edit / Accept / Reject. Then the Documents tab with the OCR viewer.
SAY: "Open a patient and the history is already written, in standard clinical order. This is a draft. The doctor can edit it, accept it, or reject it. The AI never diagnoses. Documents sit right next to it with the extracted values, so the doctor can check the source in one click."

**Prescription safety (6:30 - 7:10)**
SHOW: Consultation tab, Rx writer. Add two brand names with the same ingredient (for example Dolo 650 and Calpol 500) and show the duplicate-therapy alert. Then show a serious interaction (for example aspirin and warfarin) and the generic alternatives list.
Test these exact pairs before recording; use whichever pair actually triggers an alert.
SAY: "When the doctor prescribes, a safety engine checks the list against the National List of Essential Medicines. Dolo and Calpol look different but are both paracetamol, so it flags a duplicate. Dangerous combinations are flagged with the reason and what to do. And it suggests Jan Aushadhi generics, which can cut the patient's cost. If it doesn't recognise a drug it says 'review required', never 'safe'."

**Regional signal (7:10 - 7:30)**
SHOW: Regional surveillance card, only if it is loading real data from the API.
SAY: "On the side, a regional disease-signal panel gives the doctor population-level context, for example a rising outbreak in the district. It is decision support only, and it never diagnoses an individual."

### 7:30 - 8:30  App 3 and 4 - Patient Portal and Android app
SHOW: Patient portal login with mobile OTP (or the demo login), then tabs: Dashboard, Medical Reports, Prescriptions, Appointments, Follow-ups, Billing, Notifications. Then the Android app on a phone or emulator: OTP login, health locker, e-prescriptions.
SAY: "Now the patient's side. The same patient logs in with a mobile OTP, on the web or in our Android app, and finds their records: reports, prescriptions, appointments, follow-ups and bills. So next visit, nothing is repeated, and their history travels with them instead of sitting in a drawer."

### 8:30 - 9:20  App 5, 6, 7 - RFID Portal, Hospital Admin, Central Admin
SHOW: 10-15 seconds each. RFID portal: Card Inventory, Card Encoding Desk, Security and Lifecycle Ledger. Hospital admin: Live OPD Queue, Doctor Rosters, Kiosk Fleet, HIS and ABDM tab. Central admin: National Overview, RFID National Registry, Outbreak Radar, ABDM and FHIR Command.
SAY: "Behind the scenes, three operations apps. The RFID Portal issues and encodes cards and tracks lost or suspended ones. The Hospital Admin shows queues by department, doctor rosters and the health of every kiosk. And the Central Admin gives a state-level view: the card registry, an outbreak radar and the ABDM interoperability panel. These admin dashboards are prototypes; login for them is on our roadmap."

### 9:20 - 10:00  Honest scoreboard and close
SHOW: Slide 4 chart (built / partial / planned), then a closing title card with the team name and links.
SAY: "Let me be straight about where we are. Working today: the kiosk with voice and touch, the adaptive interviews including AYUSH, the deterministic emergency alerts, document scanning, the doctor dashboard with prescription safety, and the patient portal and app. In demo mode: ABDM and FHIR, which we generate but do not yet send to the live network. Next: Bhashini speech models, real vitals sensors, and a pilot in a real OPD. If we save even one or two minutes of history-taking per patient, then across five thousand patients a day that is about eighty-three to a hundred and sixty-seven doctor-hours freed, every single day (this is our assumption, to be validated in a pilot). That is the goal: give the doctor the whole story, and give the patient their two minutes back. We are Team CODEBLOOM 2.0. Thank you, and the links to our idea document and code are in the description."

---

## BEFORE YOU RECORD

1. Start the backend: `pnpm --filter backend dev` (port 4000). Start the front-ends: `pnpm dev`. Kiosk 5173, doctor 5174, hospital 5176, central 5177, patient app 5178. The patient portal and the RFID portal are both set to 5175, so one will move to another port: read the terminal for the real URLs.
2. Hardware: run [run-rfid.bat](../../run-rfid.bat) if you show the physical reader. Enrol one card in the RFID portal so it maps to a patient.
3. Chrome, microphone allowed (voice input does not work in Firefox). Set the OCR key (GEMINI_API_KEY) and test a real prescription photo, otherwise you will see canned sample output.
4. Logins: doctor = demo.doctor@medikiosk.local / demo (the on-screen hint says MediKiosk@123, which belongs to a different account, doctor@medikiosk.local). Hospital admin, RFID and central admin portals open with no login.
5. Demo patients (password-free, via card or phone): Aarav Sharma 9800000001 (DEMO-RFID-001), Priya Verma 9800000002, Ramesh Patel 9800000003 (DEMO-RFID-003), Sunita Devi 9800000004, Vikramaditya Joshi 9800000005.
6. You can also record from the live deployment instead of localhost: https://medikiosk-sih26047-three.vercel.app (apps at /kiosk, /doctor, /portal, /app, /rfid, /hospital, /central). Its health check reports demo mode on and the database connected. A physical RFID reader only works with the local backend and run-rfid.bat.
7. Do one full dry run. Never show .env files.

## DO NOT SHOW OR CLAIM (these are static or simulated in the code)

- Doctor dashboard "Longitudinal Medical Timeline" tab and the "Answer #01 / Doc #01" citation chips: they show fixed sample text. Do not present them as live.
- Central Admin "AI Governance" model metrics (CER, F1, latency): generated by formula, not measured. Skip that page.
- Navigation badges such as "1,240 Devices", "3 Active", "5 Pipeline", and the ABDM gateway uptime numbers: hard-coded. Do not read them out.
- Surveillance card default numbers (for example "54 cases"): shown when the API does not answer. Show it only if it loaded from the API, and call it a demo dataset.
- Vitals: simulated. ABDM/FHIR: demo mode. Voice: browser speech recognition, not Bhashini.

## YOUTUBE PACKAGING

- Title (under 70 characters): "Doctors Get 2 Minutes. We Built a Kiosk That Gives Them the Whole Story"
- Thumbnail: big "2 MIN" text, a red "CRITICAL" alert badge, and the kiosk screen. Faces help.
- Set visibility to Unlisted or Public (not Private) so evaluators can open it.
- Description: one-line pitch, chapter timestamps (0:00 Hook, 2:00 Map, 2:50 Kiosk, 5:10 Doctor, 7:30 Patient apps, 8:30 Admin, 9:20 Close), then links to the idea PDF and the repo.
- Editing: speed up loading and typing to 2x, zoom into the cursor, add subtitles, keep background music quiet, and end on the last sentence (no long outro).
