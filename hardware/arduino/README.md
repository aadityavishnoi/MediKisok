# MediKiosk Arduino Nano RFID Reader

This module provides the firmware for the **MediKiosk USB RFID Intake Reader** using an **Arduino Nano** and an **NXP MFRC522 (13.56 MHz High Frequency)** RFID transceiver.

---

## 1. Hardware Bill of Materials (BOM)

| Component | Specification | Quantity |
| :--- | :--- | :--- |
| **Microcontroller** | Arduino Nano (ATmega328P, 16MHz, Type-C or Mini-USB) | 1 |
| **RFID Reader Module** | RC522 / MFRC522 (13.56 MHz, SPI Interface) | 1 |
| **RFID Tokens** | MIFARE Classic 1K / Ultralight / NTAG213/215/216 Cards or Keyfobs | As needed |
| **Jumper Wires** | Female-to-Female or Female-to-Male DuPont cables | 7 |
| **USB Cable** | USB-A to Mini-B or USB-C (data capable) | 1 |

---

## 2. Wiring & Pinout Connections

> [!CAUTION]
> **CRITICAL VOLTAGE WARNING**: The MFRC522 module **MUST BE POWERED FROM 3.3V ONLY**.
> Connecting `VCC` to `5V` will permanently damage the MFRC522 chip.
> The SPI data lines (D9, D10, D11, D12, D13) on Arduino Nano are directly compatible.

| MFRC522 Pin | Arduino Nano Pin | Function / Notes | Wire Color Recommendation |
| :--- | :--- | :--- | :--- |
| **SDA / SS** | **D10** | SPI Slave Select (Chip Enable) | Yellow |
| **SCK** | **D13** | SPI Clock | Green |
| **MOSI** | **D11** | SPI Master Out Slave In | Blue |
| **MISO** | **D12** | SPI Master In Slave Out | Violet |
| **IRQ** | *Unconnected* | Not used in polling mode | — |
| **GND** | **GND** | Ground | Black |
| **RST** | **D9** | Hardware Reset | Orange |
| **3.3V** | **3.3V** | **3.3V Power Supply Only** | Red |

---

## 3. Required Arduino Library

The firmware uses the official community MFRC522 library:

- **Library Name**: `MFRC522`
- **Author**: GithubCommunity / Miguel Balboa
- **Version**: `v1.4.11` (or latest)
- **Repository**: [https://github.com/OSSLibraries/Arduino_MFRC522](https://github.com/OSSLibraries/Arduino_MFRC522)

### Installing via Arduino IDE Library Manager:
1. Open **Arduino IDE** (v1.8.x or v2.x).
2. Go to **Sketch** &rarr; **Include Library** &rarr; **Manage Libraries...** (or `Ctrl+Shift+I`).
3. In the search filter, type: `MFRC522`.
4. Locate **"MFRC522 by GithubCommunity"** (or Miguel Balboa).
5. Click **Install**.

---

## 4. Firmware Flashing Instructions

### Method A: Using Arduino IDE (Recommended)
1. Connect your **Arduino Nano** to your computer via USB.
2. Open the sketch file:
   `hardware/arduino/medikiosk_rfid/medikiosk_rfid.ino`
3. In the Arduino IDE menu, configure your board:
   - **Tools** &rarr; **Board** &rarr; **Arduino AVR Boards** &rarr; **Arduino Nano**
   - **Tools** &rarr; **Processor** &rarr; **ATmega328P** (or *ATmega328P (Old Bootloader)* for CH340 clones)
   - **Tools** &rarr; **Port** &rarr; Select your COM port (e.g., `COM3`, `COM4`, `/dev/ttyUSB0`)
4. Click the **Verify / Compile** button (`Ctrl+R`) to confirm there are no syntax issues.
5. Click the **Upload** button (`Ctrl+U`).

### Method B: Using Arduino CLI (Command Line)
```bash
# Compile
arduino-cli compile --fqbn arduino:avr:nano:cpu=atmega328p hardware/arduino/medikiosk_rfid

# Upload (replace COM3 with your actual port)
arduino-cli upload -p COM3 --fqbn arduino:avr:nano:cpu=atmega328p hardware/arduino/medikiosk_rfid
```

---

## 5. Protocol & Serial Output Verification

1. Open the Arduino IDE **Serial Monitor** (`Ctrl+Shift+M`).
2. Set the baud rate to **`9600 baud`** and line ending to **`Newline`** (or `Both NL & CR`).
3. Tap an RFID card on the reader antenna.
4. The output will immediately print:
   ```text
   RFID_SCAN:73:4A:91:2C
   ```
5. **Debounce / Duplicate Verification**:
   - Keep the card resting on the antenna. Notice that no further lines are printed.
   - Remove the card.
   - Tap the card again. The reader emits `RFID_SCAN:73:4A:91:2C` once again.
   - Tap a different card. The reader emits its new UID (e.g. `RFID_SCAN:04:A7:89:BC:D1`).

---

## 6. Integration Architecture with MediKiosk Host

The Arduino Nano emits raw serial lines over USB. The MediKiosk backend serial bridge or standalone daemon reads these events and triggers the intake flow:

```text
[RFID Card Tap]
      │
      ▼
[MFRC522 Reader] (SPI @ 4MHz, 3.3V)
      │
      ▼
[Arduino Nano] (Formats UID -> "RFID_SCAN:73:4A:91:2C")
      │
      ▼ (USB Serial @ 9600 bps)
[MediKiosk Backend / Serial Bridge Service]
      │
      ├── Normalizes UID ("73:4a:91:2c" -> "73:4A:91:2C")
      ├── Debounces duplicate scans (1500ms sliding window)
      ├── Queries /api/rfid/patient/:uid
      └── Emits WebSocket events (RFID_SCANNED, HARDWARE_STATUS_CHANGED)
      │
      ▼
[Doctor Dashboard & Patient Intake]
      │
      ├── Detects scan instantly (Zero manual patient ID typing)
      ├── Displays "RFID Card Detected: <Patient Name>"
      └── Automatically opens Patient 360 / Active Encounter view
```

---

## 7. Backend Serial Bridge Configuration & Execution

The serial bridge communicates with the Arduino Nano via Node `serialport` and `@serialport/parser-readline`.

### 7.1 Environment Configuration (`.env`)

Add the following configuration options to your root `.env` or `apps/backend/.env`:

```env
# Enable background Arduino USB serial bridge
RFID_SERIAL_ENABLED=true

# USB COM Port (Windows: COM3, COM4; Linux: /dev/ttyUSB0, /dev/ttyACM0; macOS: /dev/cu.usbserial-*)
RFID_SERIAL_PORT=COM3

# Baud rate configured in Arduino sketch (must match Serial.begin in firmware)
RFID_SERIAL_BAUD=9600

# Minimum time (ms) between consecutive reads of the same card to prevent duplicates
RFID_DEBOUNCE_MS=1500
```

### 7.2 Detecting Available Serial / COM Ports

To identify the COM port assigned to your connected Arduino Nano, run:

```bash
# In apps/backend or workspace root:
node -e "const { SerialPort } = require('serialport'); SerialPort.list().then(ports => console.log(ports.map(p => ({ path: p.path, manufacturer: p.manufacturer }))));"
```

*Example Output:*
```json
[
  { "path": "COM3", "manufacturer": "wch.cn" },
  { "path": "COM4", "manufacturer": "FTDI" }
]
```

### 7.3 Running the Serial Bridge

You have two execution modes:

#### Mode 1: Integrated in Backend Server (Default)
When `RFID_SERIAL_ENABLED=true`, the bridge starts automatically alongside the backend HTTP and WebSocket servers:

```bash
pnpm --filter backend dev
```

#### Mode 2: Dedicated CLI Runner Daemon
To run the serial bridge as an isolated foreground process (ideal for hardware testing or separate gateway machines):

```bash
pnpm --filter backend rfid:bridge
```

*CLI Bridge Features:*
- Automatic reconnect: If the Arduino Nano is unplugged, the bridge retries every 5 seconds without crashing the server.
- WebSocket broadcast: Whenever an RFID tag is detected, it broadcasts `RFID_SCANNED` to all connected frontend clients.
- Status broadcast: Automatically broadcasts `HARDWARE_STATUS_CHANGED` with `CONNECTED` or `OFFLINE` status.

---

## 8. Patient & Encounter RFID Lookup API

### `GET /api/rfid/patient/:uid`

Looks up a registered patient and their current active encounter by card UID.

#### Security & Privacy Architecture:
- **Zero Protected Health Information (PHI) is written to the physical card.**
- The RFID card UID functions solely as a cryptographically opaque identifier linked in the backend database.
- Even if a card is lost or scanned by a third-party NFC reader, no health records or demographic data can be extracted from the card.

#### Request:
```bash
curl -X GET http://localhost:4000/api/rfid/patient/DEMO-RFID-001
```

#### Successful Response (Registered Card with Active Encounter):
`Status: 200 OK`
```json
{
  "success": true,
  "card": {
    "uid": "DEMO-RFID-001",
    "active": true,
    "issuedAt": "2026-01-01T00:00:00.000Z"
  },
  "patient": {
    "id": "demo-patient-001",
    "fullName": "Aarav Sharma",
    "dateOfBirth": "1985-03-14T00:00:00.000Z",
    "gender": "Male",
    "phone": "9999900001",
    "abhaId": "91-4820-9102-3819",
    "registrationSource": "RFID",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "encounter": {
    "id": "session-demo-patient-001",
    "status": "IDENTIFIED",
    "mode": "GENERAL",
    "language": "EN",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "consultation": null
  }
}
```

#### Error Response (Unregistered Card):
`Status: 404 Not Found`
```json
{
  "success": false,
  "message": "RFID card is not registered"
}
```

### `GET /api/rfid/status`

Retrieves the live status of the physical USB serial reader.

#### Request:
```bash
curl -X GET http://localhost:4000/api/rfid/status
```

#### Response:
`Status: 200 OK`
```json
{
  "connected": true,
  "state": "CONNECTED",
  "port": "COM3",
  "baudRate": 9600,
  "enabled": true
}
```

---

## 9. Frontend Integration & SIH Presentation Demo Mode

### 9.1 Live Hardware Intake Flow (Doctor Dashboard)
1. Launch the doctor dashboard (`pnpm --filter doctor-dashboard dev`).
2. Log in with demo doctor credentials (`demo.doctor@medikiosk.local`).
3. Tap an RFID card on the Arduino Nano reader.
4. The dashboard automatically:
   - Plays an intake audio chime / notification.
   - Shows an amber/emerald toast: `"RFID Card Detected — <Patient Name> (<UID>)"`.
   - Transitions directly to the patient's **Patient 360 / Active Encounter** (`SessionDetailScreen`).
   - **Zero manual patient ID typing is required.**
5. If the Arduino is unplugged, an orange badge in the TopBar displays:
   `"RFID Reader Disconnected"`.

### 9.2 SIH Presentation "Simulate RFID Scan" Mode
For live competition judging or environments where physical USB hardware is not plugged in, the dashboard includes a full software simulation modal:

1. Click the **"Simulate RFID"** button in the top navigation bar.
2. Select any of the pre-configured demo cards:
   - **Card 1: `DEMO-RFID-001`** &rarr; Aarav Sharma (Male, 39y, ABHA: `91-4820-9102-3819`, Chief Complaint: *Chest Pain*)
   - **Card 2: `DEMO-RFID-002`** &rarr; Priya Verma (Female, 32y, ABHA: `91-1029-4829-5710`, Chief Complaint: *Severe Breathlessness*)
   - **Card 3: `DEMO-RFID-003`** &rarr; Ramesh Patel (Male, 56y, Chronic Diabetes follow-up)
   - **Card 4: `DEMO-RFID-004`** &rarr; Sunita Devi (Female, 49y, Abdominal Pain)
   - **Unregistered Card: `UNREGISTERED-99`** &rarr; Triggers the unregistered card error flow.
3. Click **"Trigger RFID Scan"**.
4. The simulation triggers the **exact same pipeline** as real hardware:
   `Simulated Tap -> WebSocket broadcast -> /api/rfid/patient/:uid lookup -> Encounter load -> Patient 360 screen navigation`.

---

## 10. Automated Test Suite Verification

Run the comprehensive unit and integration test suite:

```bash
# Run backend RFID test suites:
pnpm --filter backend test src/routes/rfid.test.ts src/services/rfidSerialBridge.test.ts
```

### Verified Test Cases:
1. **Valid UID Normalization**: Validates 4-byte and 7-byte hex (`73:4a:91:2c`, `04-a7-89-bc-d1`, `734A912C`) and demo strings into uniform uppercase colon-separated format.
2. **Invalid UID Rejection**: Safely drops empty, malformed, or noisy lines (`RFID_SCAN:`, `RFID_SCAN:!@#$%^&*()`) without throwing.
3. **Registered Card Lookup**: `GET /api/rfid/patient/DEMO-RFID-001` returns 200 with patient demographics and active encounter.
4. **Unknown Card Handling**: `GET /api/rfid/patient/UNKNOWN-99` returns 404 with `{ success: false, message: "RFID card is not registered" }`.
5. **Duplicate Scan Debouncing**: Immediate consecutive scans within the debounce window (1500ms) are filtered out; different cards or scans after the window pass through immediately.
6. **Arduino Disconnect / Reconnect**: Verifies that opening an unavailable port does not crash the Node process, transitions state cleanly, and attempts auto-reconnect.
7. **Demo Scan Flow**: Full end-to-end simulation via `POST /api/rfid/simulate` creates sessions and matches demo records for SIH presentations.
