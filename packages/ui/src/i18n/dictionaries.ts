export interface Dictionary {
  common: {
    demoMode: string;
    loading: string;
    tryAgain: string;
    continueButton: string;
    backButton: string;
    listen: string;
    speaking: string;
    stop: string;
    connected: string;
    connecting: string;
    reconnecting: string;
    connectionUnavailable: string;
    needHelp: string;
    helpTitle: string;
    helpBody: string;
    closeButton: string;
    privacyNote: string;
    sessionLabel: string;
    hospitalPlaceholder: string;
    idleTitle: string;
    idleBody: string;
    idleContinue: string;
    idleSecondsRemaining: string;
  };
  steps: {
    identify: string;
    language: string;
    consent: string;
    complaint: string;
    history: string;
    done: string;
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
    hardwareNotConnected: string;
  };
  language: {
    title: string;
    subtitle: string;
    english: string;
    hindi: string;
  };
  consent: {
    title: string;
    points: string[];
    agree: string;
    disagree: string;
    declinedMessage: string;
  };
  chiefComplaint: {
    title: string;
    subtitle: string;
    hints: Record<string, string>;
  };
  history: {
    speak: string;
    listening: string;
    tapToStop: string;
    voiceUnavailable: string;
    textPlaceholder: string;
    submit: string;
    redFlagBanner: string;
    redFlagSubtext: string;
    thankYouTitle: string;
    thankYouBody: string;
    phaseSymptoms: string;
    phaseBackground: string;
    phaseAyush: string;
    almostThere: string;
    gettingStarted: string;
    halfway: string;
  };
}

export const en: Dictionary = {
  common: {
    demoMode: 'Demo Mode',
    loading: 'Loading…',
    tryAgain: 'Try Again',
    continueButton: 'Continue',
    backButton: 'Back',
    listen: 'Listen',
    speaking: 'Speaking…',
    stop: 'Stop',
    connected: 'Connected',
    connecting: 'Connecting…',
    reconnecting: 'Reconnecting…',
    connectionUnavailable: 'Connection temporarily unavailable',
    needHelp: 'Need help?',
    helpTitle: 'Need assistance?',
    helpBody: 'Please ask any hospital staff member nearby, or visit the registration desk. Your progress on this screen will be kept while you get help.',
    closeButton: 'Close',
    privacyNote: 'Your information is kept private and secure',
    sessionLabel: 'Session',
    hospitalPlaceholder: 'MediKiosk Hospital Network',
    idleTitle: 'Are you still there?',
    idleBody: 'For your privacy, this kiosk will restart soon if there is no activity.',
    idleContinue: "I'm still here",
    idleSecondsRemaining: 'seconds remaining',
  },
  steps: {
    identify: 'Identify',
    language: 'Language',
    consent: 'Consent',
    complaint: 'Complaint',
    history: 'History',
    done: 'Done',
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
    hardwareNotConnected: 'Physical RFID hardware is not connected yet — use a demo button below to continue.',
  },
  language: {
    title: 'Choose your language',
    subtitle: 'भाषा चुनें',
    english: 'English',
    hindi: 'हिन्दी',
  },
  consent: {
    title: 'Before we begin',
    points: [
      'We ask a few questions about your health so the doctor already understands your situation before you walk in.',
      'Your answers are stored securely and only seen by hospital staff involved in your care.',
      'You may decline — this will not affect your ability to see a doctor.',
      'This kiosk does not replace a medical consultation or give you a diagnosis.',
      'If you are having a medical emergency right now, please tell hospital staff immediately.',
    ],
    agree: 'I Agree',
    disagree: 'I Do Not Agree',
    declinedMessage: 'You have chosen not to continue. Please speak with the registration desk if you change your mind.',
  },
  chiefComplaint: {
    title: 'What brings you here today?',
    subtitle: 'Choose the option closest to your main problem',
    hints: {
      'chest-pain': 'Pain, pressure, or tightness in the chest',
      'breathing-difficulty': 'Trouble breathing or catching your breath',
      'abdominal-pain': 'Pain or discomfort in your stomach area',
      fever: 'Raised body temperature, chills, or feeling hot',
      headache: 'Pain or pressure in your head',
      'general-fallback': 'Describe your problem in your own words',
    },
  },
  history: {
    speak: 'Speak your answer',
    listening: 'Listening…',
    tapToStop: 'Tap to stop',
    voiceUnavailable: "Voice input isn't available on this device. You can type your answer instead.",
    textPlaceholder: 'Type your answer here',
    submit: 'Submit',
    redFlagBanner: 'Potential emergency symptoms detected',
    redFlagSubtext: 'Please inform the medical staff immediately.',
    thankYouTitle: 'Thank you',
    thankYouBody: 'Your information has been sent to the medical team. Please wait for the doctor to call you.',
    phaseSymptoms: 'Understanding your symptoms',
    phaseBackground: 'Medical background',
    phaseAyush: 'Additional assessment',
    almostThere: 'Almost there',
    gettingStarted: 'Just getting started',
    halfway: 'About halfway there',
  },
};

export const hi: Dictionary = {
  common: {
    demoMode: 'डेमो मोड',
    loading: 'लोड हो रहा है…',
    tryAgain: 'पुनः प्रयास करें',
    continueButton: 'आगे बढ़ें',
    backButton: 'पीछे जाएं',
    listen: 'सुनें',
    speaking: 'बोल रहे हैं…',
    stop: 'रोकें',
    connected: 'जुड़ा हुआ है',
    connecting: 'जुड़ रहा है…',
    reconnecting: 'पुनः जुड़ रहा है…',
    connectionUnavailable: 'कनेक्शन अस्थायी रूप से उपलब्ध नहीं है',
    needHelp: 'मदद चाहिए?',
    helpTitle: 'सहायता चाहिए?',
    helpBody: 'कृपया आस-पास किसी अस्पताल कर्मचारी से पूछें, या पंजीकरण डेस्क पर जाएं। मदद लेने के दौरान इस स्क्रीन की जानकारी सुरक्षित रहेगी।',
    closeButton: 'बंद करें',
    privacyNote: 'आपकी जानकारी निजी और सुरक्षित रखी जाती है',
    sessionLabel: 'सत्र',
    hospitalPlaceholder: 'मेडीकिओस्क हॉस्पिटल नेटवर्क',
    idleTitle: 'क्या आप अभी भी वहाँ हैं?',
    idleBody: 'आपकी गोपनीयता के लिए, कोई गतिविधि न होने पर यह कियोस्क जल्द ही पुनः आरंभ होगा।',
    idleContinue: 'हाँ, मैं यहाँ हूँ',
    idleSecondsRemaining: 'सेकंड शेष',
  },
  steps: {
    identify: 'पहचान',
    language: 'भाषा',
    consent: 'सहमति',
    complaint: 'समस्या',
    history: 'इतिहास',
    done: 'पूर्ण',
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
    hardwareNotConnected: 'भौतिक आरएफआईडी हार्डवेयर अभी जुड़ा नहीं है — कृपया नीचे दिए डेमो बटन का उपयोग करें।',
  },
  language: {
    title: 'भाषा चुनें',
    subtitle: 'Choose your language',
    english: 'English',
    hindi: 'हिन्दी',
  },
  consent: {
    title: 'शुरू करने से पहले',
    points: [
      'हम आपके स्वास्थ्य के बारे में कुछ प्रश्न पूछते हैं ताकि डॉक्टर आपसे मिलने से पहले ही आपकी स्थिति समझ सकें।',
      'आपके उत्तर सुरक्षित रूप से रखे जाते हैं और केवल आपकी देखभाल से जुड़े अस्पताल कर्मचारी ही इन्हें देखते हैं।',
      'आप मना कर सकते हैं — इससे डॉक्टर को दिखाने की आपकी क्षमता प्रभावित नहीं होगी।',
      'यह कियोस्क डॉक्टर की सलाह या निदान का विकल्प नहीं है।',
      'यदि आपको अभी कोई चिकित्सा आपातकाल हो रहा है, तो कृपया तुरंत अस्पताल कर्मचारियों को बताएं।',
    ],
    agree: 'मैं सहमत हूँ',
    disagree: 'मैं सहमत नहीं हूँ',
    declinedMessage: 'आपने आगे न बढ़ने का विकल्प चुना है। कृपया पंजीकरण डेस्क से बात करें।',
  },
  chiefComplaint: {
    title: 'आज आपको क्या समस्या हो रही है?',
    subtitle: 'अपनी मुख्य समस्या के सबसे करीब विकल्प चुनें',
    hints: {
      'chest-pain': 'सीने में दर्द, दबाव या जकड़न',
      'breathing-difficulty': 'सांस लेने में या सांस पूरी लेने में कठिनाई',
      'abdominal-pain': 'पेट के क्षेत्र में दर्द या असुविधा',
      fever: 'शरीर का तापमान बढ़ना, ठंड लगना या गर्मी महसूस होना',
      headache: 'सिर में दर्द या दबाव',
      'general-fallback': 'अपनी समस्या अपने शब्दों में बताएं',
    },
  },
  history: {
    speak: 'अपना उत्तर बोलें',
    listening: 'सुन रहे हैं…',
    tapToStop: 'रोकने के लिए दबाएं',
    voiceUnavailable: 'इस डिवाइस पर आवाज़ इनपुट उपलब्ध नहीं है। आप इसके बजाय टाइप कर सकते हैं।',
    textPlaceholder: 'यहाँ अपना उत्तर लिखें',
    submit: 'जमा करें',
    redFlagBanner: 'संभावित आपातकालीन लक्षण मिले हैं',
    redFlagSubtext: 'कृपया तुरंत चिकित्सा कर्मचारियों को सूचित करें।',
    thankYouTitle: 'धन्यवाद',
    thankYouBody: 'आपकी जानकारी चिकित्सा टीम को भेज दी गई है। कृपया डॉक्टर के बुलाने की प्रतीक्षा करें।',
    phaseSymptoms: 'आपके लक्षणों को समझना',
    phaseBackground: 'चिकित्सा पृष्ठभूमि',
    phaseAyush: 'अतिरिक्त मूल्यांकन',
    almostThere: 'लगभग पूर्ण',
    gettingStarted: 'अभी शुरुआत हुई है',
    halfway: 'लगभग आधा पूरा',
  },
};

export const dictionaries = { EN: en, HI: hi } as const;
