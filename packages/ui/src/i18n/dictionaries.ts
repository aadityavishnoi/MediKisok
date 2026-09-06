export interface Dictionary {
  common: {
    demoMode: string;
    loading: string;
    tryAgain: string;
    continueButton: string;
    listen: string;
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
  language: {
    title: string;
    subtitle: string;
    english: string;
    hindi: string;
  };
  consent: {
    title: string;
    body: string;
    agree: string;
    disagree: string;
    declinedMessage: string;
  };
  chiefComplaint: {
    title: string;
    subtitle: string;
  };
  history: {
    speak: string;
    listening: string;
    voiceUnavailable: string;
    textPlaceholder: string;
    submit: string;
    redFlagBanner: string;
    thankYouTitle: string;
    thankYouBody: string;
  };
}

export const en: Dictionary = {
  common: {
    demoMode: 'Demo Mode',
    loading: 'Loading…',
    tryAgain: 'Try Again',
    continueButton: 'Continue',
    listen: 'Listen',
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
  language: {
    title: 'Choose your language',
    subtitle: 'भाषा चुनें',
    english: 'English',
    hindi: 'हिन्दी',
  },
  consent: {
    title: 'Your Privacy',
    body: 'Your information will be used to prepare your medical history for the doctor. It will not be shared outside this hospital.',
    agree: 'I Agree',
    disagree: 'I Do Not Agree',
    declinedMessage: 'You have chosen not to continue. Please speak with the registration desk if you change your mind.',
  },
  chiefComplaint: {
    title: 'What problem are you having today?',
    subtitle: 'Choose the option closest to your main problem',
  },
  history: {
    speak: 'Speak your answer',
    listening: 'Listening…',
    voiceUnavailable: 'Voice unavailable — use touch',
    textPlaceholder: 'Type your answer here',
    submit: 'Submit',
    redFlagBanner: 'Potential emergency symptoms detected. Please contact hospital staff immediately.',
    thankYouTitle: 'Thank you',
    thankYouBody: 'Your history has been recorded. Please proceed to document scanning.',
  },
};

export const hi: Dictionary = {
  common: {
    demoMode: 'डेमो मोड',
    loading: 'लोड हो रहा है…',
    tryAgain: 'पुनः प्रयास करें',
    continueButton: 'आगे बढ़ें',
    listen: 'सुनें',
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
  language: {
    title: 'भाषा चुनें',
    subtitle: 'Choose your language',
    english: 'English',
    hindi: 'हिन्दी',
  },
  consent: {
    title: 'आपकी गोपनीयता',
    body: 'आपकी जानकारी का उपयोग डॉक्टर के लिए आपका मेडिकल इतिहास तैयार करने हेतु किया जाएगा। इसे इस अस्पताल के बाहर साझा नहीं किया जाएगा।',
    agree: 'मैं सहमत हूँ',
    disagree: 'मैं सहमत नहीं हूँ',
    declinedMessage: 'आपने आगे न बढ़ने का विकल्प चुना है। कृपया पंजीकरण डेस्क से बात करें।',
  },
  chiefComplaint: {
    title: 'आज आपको क्या समस्या हो रही है?',
    subtitle: 'अपनी मुख्य समस्या के सबसे करीब विकल्प चुनें',
  },
  history: {
    speak: 'अपना उत्तर बोलें',
    listening: 'सुन रहे हैं…',
    voiceUnavailable: 'आवाज़ उपलब्ध नहीं — स्पर्श का उपयोग करें',
    textPlaceholder: 'यहाँ अपना उत्तर लिखें',
    submit: 'जमा करें',
    redFlagBanner: 'संभावित आपातकालीन लक्षण मिले हैं। कृपया तुरंत अस्पताल के कर्मचारियों से संपर्क करें।',
    thankYouTitle: 'धन्यवाद',
    thankYouBody: 'आपका इतिहास दर्ज कर लिया गया है। कृपया दस्तावेज़ स्कैनिंग के लिए आगे बढ़ें।',
  },
};

export const dictionaries = { EN: en, HI: hi } as const;
