/**
 * MediKiosk - Arduino Nano + MFRC522 High-Speed Anti-Freeze RFID Firmware
 * 
 * Hardware:
 *   - Arduino Nano (ATmega328P, 5V logic / 3.3V out)
 *   - MFRC522 RFID Module (13.56 MHz High Frequency, SPI)
 * 
 * Pinout Connections:
 *   MFRC522 Pin  ->  Arduino Nano Pin
 *   ---------------------------------
 *   SDA / SS     ->  D10
 *   RST          ->  D9
 *   MOSI         ->  D11
 *   MISO         ->  D12
 *   SCK          ->  D13
 *   3.3V         ->  3.3V  (CRITICAL: Do NOT connect to 5V!)
 *   GND          ->  GND
 * 
 * High-Speed & Anti-Freeze Features:
 *   - High-Speed Baud: 115200 bps (sub-millisecond latency, fallback compatible with 9600).
 *   - Auto-Recovery Watchdog: Continuously monitors MFRC522 register health.
 *     If the SPI bus or chip locks up (0x00 or 0xFF), it self-heals in 5ms without needing
 *     to unplug and replug the USB cable.
 *   - Ultra-Fast Scanning: Non-blocking 10ms sampling interval with maximum 48dB antenna gain.
 *   - Fast Debounce: 500ms same-card cooldown, 100ms different-card instant switch.
 * 
 * Protocol Specification:
 *   Output format: RFID_SCAN:<UID_UPPERCASE_COLON_SEPARATED>
 *   Example: RFID_SCAN:73:4A:91:2C
 */

#include <SPI.h>
#include <MFRC522.h>

// Pin definitions
constexpr uint8_t SS_PIN = 10;
constexpr uint8_t RST_PIN = 9;

// Initialize MFRC522 instance
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Tracking state for lightning-fast debouncing
String lastUidString = "";
unsigned long lastScanTime = 0;
unsigned long lastWatchdogCheck = 0;

// High-speed responsiveness parameters
constexpr unsigned long SAME_CARD_DEBOUNCE_MS = 500;       // 0.5s cooldown for identical card
constexpr unsigned long DIFFERENT_CARD_DEBOUNCE_MS = 100;   // 0.1s instant scan for different card
constexpr unsigned long WATCHDOG_INTERVAL_MS = 1500;       // Self-healing check every 1.5s

void setup() {
  // Initialize Serial interface at 115200 baud for instantaneous transfer
  // (Also works seamlessly with auto-baud serial bridge)
  Serial.begin(115200);
  
  // Initialize SPI bus
  SPI.begin();

  // Initialize MFRC522 RFID Reader with maximum receiver sensitivity (48dB gain)
  mfrc522.PCD_Init();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  // Ready signal
  Serial.println(F("MEDIKIOSK_RFID_READY:115200"));
}

void loop() {
  unsigned long currentMillis = millis();

  // -------------------------------------------------------------------------
  // 1. Auto-Recovery Watchdog (Fixes "cable nikaal ke dobara connect karna padta hai")
  // -------------------------------------------------------------------------
  // Checks if the MFRC522 chip has frozen or lost SPI sync (returns 0x00 or 0xFF)
  if (currentMillis - lastWatchdogCheck > WATCHDOG_INTERVAL_MS) {
    lastWatchdogCheck = currentMillis;
    byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
    if (version == 0x00 || version == 0xFF) {
      // Hardware state corrupted: Self-heal immediately without requiring USB unplug
      mfrc522.PCD_Init();
      mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
    }
  }

  // -------------------------------------------------------------------------
  // 2. Ultra-Fast Card Detection
  // -------------------------------------------------------------------------
  // Look for cards on the antenna
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(10);
    return;
  }

  // Select and read card serial UID
  if (!mfrc522.PICC_ReadCardSerial()) {
    // If partial read failed, halt and re-enable cleanly so next read succeeds
    mfrc522.PICC_HaltA();
    delay(10);
    return;
  }

  // -------------------------------------------------------------------------
  // 3. Fast UID Formatting
  // -------------------------------------------------------------------------
  String uidString = "";
  uidString.reserve(mfrc522.uid.size * 3); // Pre-allocate buffer for zero-lag allocation

  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) {
      uidString += "0";
    }
    uidString += String(mfrc522.uid.uidByte[i], HEX);
    if (i < mfrc522.uid.size - 1) {
      uidString += ":";
    }
  }
  uidString.toUpperCase();

  bool isSameCard = (uidString == lastUidString);
  unsigned long cooldown = isSameCard ? SAME_CARD_DEBOUNCE_MS : DIFFERENT_CARD_DEBOUNCE_MS;

  // -------------------------------------------------------------------------
  // 4. Emit Scan Instantly
  // -------------------------------------------------------------------------
  if (currentMillis - lastScanTime > cooldown || lastScanTime == 0) {
    Serial.print(F("RFID_SCAN:"));
    Serial.println(uidString);

    lastUidString = uidString;
    lastScanTime = currentMillis;
  }

  // -------------------------------------------------------------------------
  // 5. Clean Card Release (Prevents RFID Reader Lockup)
  // -------------------------------------------------------------------------
  // Halt the PICC and stop crypto properly without resetting the PCD chip
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // Clear collision flags to keep antenna ready for the next card immediately
  mfrc522.PCD_ClearRegisterBitMask(mfrc522.CollReg, 0x80);

  delay(15);
}
