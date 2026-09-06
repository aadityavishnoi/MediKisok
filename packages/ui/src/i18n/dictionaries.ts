export interface Dictionary {
  common: {
    demoMode: string;
    loading: string;
    tryAgain: string;
  };
  identify: {
    title: string;
    subtitle: string;
    tapCard: string;
    waitingForCard: string;
    identifiedSuccess: string;
    cardNotRecognized: string;
    simulateSectionTitle: string;
    simulateNormal: string;
    simulateEmergency: string;
  };
}

export const en: Dictionary = {
  common: {
    demoMode: 'Demo Mode',
    loading: 'Loading…',
    tryAgain: 'Try Again',
  },
  identify: {
    title: 'Welcome to MediKiosk',
    subtitle: 'Let’s get your visit started',
    tapCard: 'Tap your patient card on the reader',
    waitingForCard: 'Waiting for card…',
    identifiedSuccess: 'Patient identified successfully',
    cardNotRecognized: 'Card not recognized. Please contact the registration desk.',
    simulateSectionTitle: 'No card reader nearby? (Demo)',
    simulateNormal: 'Simulate RFID Scan — Demo Patient 001',
    simulateEmergency: 'Simulate RFID Scan — Demo Patient 002',
  },
};

export const hi: Dictionary = {
  common: {
    demoMode: 'डेमो मोड',
    loading: 'लोड हो रहा है…',
    tryAgain: 'पुनः प्रयास करें',
  },
  identify: {
    title: 'मेडीकिओस्क में आपका स्वागत है',
    subtitle: 'आइए आपकी प्रक्रिया शुरू करें',
    tapCard: 'अपना पेशेंट कार्ड रीडर पर रखें',
    waitingForCard: 'कार्ड की प्रतीक्षा है…',
    identifiedSuccess: 'मरीज की पहचान सफल हुई',
    cardNotRecognized: 'कार्ड पहचाना नहीं गया। कृपया पंजीकरण डेस्क से संपर्क करें।',
    simulateSectionTitle: 'कोई कार्ड रीडर नहीं? (डेमो)',
    simulateNormal: 'आरएफआईडी स्कैन का अनुकरण करें — डेमो मरीज 001',
    simulateEmergency: 'आरएफआईडी स्कैन का अनुकरण करें — डेमो मरीज 002',
  },
};

export const dictionaries = { EN: en, HI: hi } as const;
