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
 * High-Speed & Continuous Re-scan Features:
 *   - Standard Universal Baud Rate: 9600 bps (matched to WebSerial, Serial Bridge & Browser)
 *   - WUPA (Wake-Up Type A) Auto-Wake: Wakes up cards even after PICC_HaltA() and page reloads.
 *   - Antenna Power Cycle on Release: PCD_Init() re-arms the transceiver after each scan,
 *     ensuring that refreshing the web page or scanning again NEVER freezes or ignores the card.
 *   - Auto-Recovery Watchdog: Self-heals SPI register health if communication desyncs.
 *   - Fast Debounce: 600ms same-card cooldown, 100ms different-card instant switch.
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

// Tracking state for debouncing
String lastUidString = "";
unsigned long lastScanTime = 0;
unsigned long lastWatchdogCheck = 0;

// Responsiveness parameters
constexpr unsigned long SAME_CARD_DEBOUNCE_MS = 600;       // 0.6s cooldown for identical card
constexpr unsigned long DIFFERENT_CARD_DEBOUNCE_MS = 100;   // 0.1s instant scan for different card
constexpr unsigned long WATCHDOG_INTERVAL_MS = 2000;       // Self-healing check every 2.0s

void setup() {
  // Initialize Serial interface at standard 9600 baud for 100% universal compatibility
  Serial.begin(9600);
  
  // Initialize SPI bus
  SPI.begin();

  // Initialize MFRC522 RFID Reader with maximum receiver sensitivity (48dB gain)
  mfrc522.PCD_Init();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  delay(100);

  // Ready signal
  Serial.println(F("MEDIKIOSK_RFID_READY:9600"));
}

void loop() {
  unsigned long currentMillis = millis();

  // -------------------------------------------------------------------------
  // 1. Auto-Recovery Watchdog: Self-heal if SPI bus locks up
  // -------------------------------------------------------------------------
  if (currentMillis - lastWatchdogCheck > WATCHDOG_INTERVAL_MS) {
    lastWatchdogCheck = currentMillis;
    byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
    if (version == 0x00 || version == 0xFF) {
      mfrc522.PCD_Init();
      mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
    }
  }

  // -------------------------------------------------------------------------
  // 2. Dual-Mode Card Detection (REQA for new card + WUPA for halted card)
  // -------------------------------------------------------------------------
  byte bufferATQA[2];
  byte bufferSize = sizeof(bufferATQA);

  bool cardPresent = mfrc522.PICC_IsNewCardPresent();
  if (!cardPresent) {
    // If PICC_IsNewCardPresent returned false (card was halted in previous cycle or page refreshed),
    // wake up any card residing in the RF field using WUPA (Wake-Up All 0x52)
    mfrc522.PCD_WriteRegister(mfrc522.TxModeReg, 0x00);
    mfrc522.PCD_WriteRegister(mfrc522.RxModeReg, 0x00);
    mfrc522.PCD_WriteRegister(mfrc522.ModWidthReg, 0x26);
    MFRC522::StatusCode status = mfrc522.PICC_WakeupA(bufferATQA, &bufferSize);
    cardPresent = (status == MFRC522::STATUS_OK);
  }

  if (!cardPresent) {
    delay(20);
    return;
  }

  // -------------------------------------------------------------------------
  // 3. Read Card Serial UID
  // -------------------------------------------------------------------------
  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(20);
    return;
  }

  // -------------------------------------------------------------------------
  // 4. Fast UID Formatting (e.g. 73:4A:91:2C)
  // -------------------------------------------------------------------------
  String uidString = "";
  uidString.reserve(mfrc522.uid.size * 3);

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
  // 5. Emit Scan Instantly to Serial
  // -------------------------------------------------------------------------
  if (currentMillis - lastScanTime > cooldown || lastScanTime == 0) {
    Serial.print(F("RFID_SCAN:"));
    Serial.println(uidString);

    lastUidString = uidString;
    lastScanTime = currentMillis;
  }

  // -------------------------------------------------------------------------
  // 6. Clean Card Release & Antenna Re-Arm (Fixes "page refresh ke baad scan nahi hota")
  // -------------------------------------------------------------------------
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // Re-arm PCD antenna transceivers so next scan or browser reload works instantaneously
  mfrc522.PCD_Init();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  delay(30);
}
