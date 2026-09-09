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

// Tracking state to prevent duplicate continuous scans of the same card
String lastUidString = "";
unsigned long lastScanTime = 0;
constexpr unsigned long SAME_CARD_DEBOUNCE_MS = 1500; // 1.5s cooldown for identical card
constexpr unsigned long DIFFERENT_CARD_DEBOUNCE_MS = 400; // Fast scan for different card

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
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  // Short stabilization delay
  delay(100);
}

void loop() {
  // 1. Look for cards on the antenna
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(40);
    return;
  }

  // 2. Select and read card serial UID
  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(40);
    return;
  }

  // 3. Format UID into uppercase colon-separated hex format
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

  unsigned long currentMillis = millis();
  bool isSameCard = (uidString == lastUidString);
  unsigned long cooldown = isSameCard ? SAME_CARD_DEBOUNCE_MS : DIFFERENT_CARD_DEBOUNCE_MS;

  // 4. If cooldown has elapsed (or if it is a different card), emit scan
  if (currentMillis - lastScanTime > cooldown || lastScanTime == 0) {
    // Send exact protocol message over Serial: RFID_SCAN:UID
    Serial.print("RFID_SCAN:");
    Serial.println(uidString);

    lastUidString = uidString;
    lastScanTime = currentMillis;
  }

  // 5. Halt PICC and stop crypto cleanly
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // 6. Safe re-arm of antenna to ensure SPI state machine never hangs
  mfrc522.PCD_Init();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  delay(60);
}

