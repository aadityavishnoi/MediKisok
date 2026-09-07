/**
 * MediKiosk - Arduino Nano + MFRC522 RFID Reader Firmware
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
 * Protocol Specification:
 *   Baud rate: 9600 bps
 *   Output format: RFID_SCAN:<UID_UPPERCASE_COLON_SEPARATED>
 *   Example: RFID_SCAN:73:4A:91:2C
 * 
 * Duplicate Prevention:
 *   - Emits exactly ONE scan string when a card is brought to the antenna.
 *   - Suppresses repeated output while the card remains held on the reader.
 *   - Allows the card (or a new card) to be scanned again once lifted and replaced.
 * 
 * Security:
 *   - Zero patient or clinical data stored or emitted by this firmware.
 *   - Only transmits the card hardware UID.
 */

#include <SPI.h>
#include <MFRC522.h>

// Pin definitions
constexpr uint8_t SS_PIN = 10;
constexpr uint8_t RST_PIN = 9;

// Initialize MFRC522 instance
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Tracking state to prevent duplicate continuous scans
bool cardPresent = false;
byte lastUidBytes[10];
byte lastUidLength = 0;
uint8_t cardAbsentCount = 0;

void setup() {
  // Initialize Serial interface at 9600 baud
  Serial.begin(9600);
  while (!Serial) {
    ; // Wait for serial port to connect (required for native USB boards)
  }

  // Initialize SPI bus
  SPI.begin();

  // Initialize MFRC522 RFID Reader
  mfrc522.PCD_Init();

  // Optional: Set antenna gain to maximum for reliable card coupling
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  // Short stabilization delay
  delay(100);

  // Diagnostics check (optional, self-test verification)
  // Firmware is ready for continuous scanning
}

/**
 * Checks if the previously scanned card is still physically present on the reader antenna.
 * Sends a WUPA (Wake-Up Type A) request. If the card is still on the reader, it acknowledges.
 */
bool isCardStillOnReader() {
  byte bufferATQA[2];
  byte bufferSize = sizeof(bufferATQA);

  // Reset baud rates / transceivers before polling
  mfrc522.PCD_WriteRegister(mfrc522.TxModeReg, 0x00);
  mfrc522.PCD_WriteRegister(mfrc522.RxModeReg, 0x00);
  mfrc522.PCD_WriteRegister(mfrc522.ModWidthReg, 0x26);

  MFRC522::StatusCode result = mfrc522.PICC_WakeupA(bufferATQA, &bufferSize);
  return (result == MFRC522::STATUS_OK);
}

/**
 * Compares current UID with the last registered UID.
 */
bool isSameAsLastUid(const MFRC522::Uid &currentUid) {
  if (currentUid.size != lastUidLength) {
    return false;
  }
  for (byte i = 0; i < currentUid.size; i++) {
    if (currentUid.uidByte[i] != lastUidBytes[i]) {
      return false;
    }
  }
  return true;
}

void loop() {
  // 1. If we currently have a card recorded as present, check if it was removed
  if (cardPresent) {
    if (!isCardStillOnReader()) {
      cardAbsentCount++;
      // Require 2 consecutive misses (~100ms) to filter radio noise/flutter
      if (cardAbsentCount >= 2) {
        cardPresent = false;
        lastUidLength = 0;
        cardAbsentCount = 0;
      }
    } else {
      // Card is still held on the reader
      cardAbsentCount = 0;
    }
    delay(50);
    return;
  }

  // 2. Look for new cards on the antenna
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  // 3. Select and read card serial UID
  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // 4. Format UID into uppercase colon-separated hex format
  // Example: 73:4A:91:2C or 04:A7:89:BC:D1:2E:3F
  String uidString = "";
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

  // 5. Send exact protocol message over Serial: RFID_SCAN:UID
  Serial.print("RFID_SCAN:");
  Serial.println(uidString);

  // 6. Record state to prevent continuous duplicate triggers
  cardPresent = true;
  lastUidLength = mfrc522.uid.size;
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    lastUidBytes[i] = mfrc522.uid.uidByte[i];
  }
  cardAbsentCount = 0;

  // 7. Halt PICC and stop encryption to complete the transaction cleanly
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  delay(100);
}
