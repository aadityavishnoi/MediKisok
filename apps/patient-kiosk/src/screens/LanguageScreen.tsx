import { en, SUPPORTED_LANGUAGES } from '@medikiosk/ui';
import { Volume2, Languages } from 'lucide-react';

const t = en.language;

// Native-script welcome greetings for all 13 Indian languages
const GREETINGS: Record<string, string> = {
  EN: 'Welcome to MediKiosk. Please follow the instructions on screen.',
  HI: 'मेडीकियोस्क में आपका स्वागत है। कृपया स्क्रीन पर दिए निर्देशों का पालन करें।',
  BN: 'মেডিকিয়োস্কে আপনাকে স্বাগতম। অনুগ্রহ করে স্ক্রিনের নির্দেশ অনুসরণ করুন।',
  MR: 'मेडीकियोस्कमध्ये आपले स्वागत आहे. कृपया स्क्रीनवरील सूचना पाळा.',
  TE: 'మెడికియోస్క్‌కి స్వాగతం. దయచేసి స్క్రీన్‌లోని సూచనలను అనుసరించండి.',
  TA: 'மெடிகியோஸ்கிற்கு நல்வரவு. திரையில் உள்ள வழிமுறைகளை பின்பற்றவும்.',
  GU: 'મેડીકિયોસ્કમાં આપનું સ્વાગત છે. કૃપા કરી સ્ક્રીન પરની સૂચનાઓ અનુસરો.',
  KN: 'ಮೆಡಿಕಿಯೋಸ್ಕ್ಗೆ ಸ್ವಾಗತ. ದಯವಿಟ್ಟು ಪರದೆಯ ಮೇಲಿನ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಿ.',
  ML: 'മെഡികിയോസ്കിലേക്ക് സ്വാഗതം. ദയവായി സ്ക്രീനിലെ നിർദ്ദേശങ്ങൾ പാലിക്കുക.',
  PA: 'ਮੈਡੀਕਿਓਸਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਕ੍ਰੀਨ ਦੀਆਂ ਹਦਾਇਤਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ।',
  OR: 'ମେଡିକିଓସ୍କକୁ ସ୍ୱାଗତ। ଦୟାକରି ସ୍କ୍ରିନ୍ ଉପରେ ଦିଆଯାଇଥିବା ନିର୍ଦ୍ଦେଶ ଅନୁସରଣ କରନ୍ତୁ।',
  AS: 'মেডিকিয়স্কলৈ স্বাগতম। অনুগ্ৰহ কৰি পৰ্দাখনৰ নিৰ্দেশাৱলী অনুসৰণ কৰক।',
  UR: 'میڈی کیوسک میں خوش آمدید۔ براہ کرم اسکرین پر دی گئی ہدایات پر عمل کریں۔',
};

// BCP-47 lang tags for all 13 languages
const LANG_TAGS: Record<string, string> = {
  EN: 'en-IN', HI: 'hi-IN', BN: 'bn-IN', MR: 'mr-IN',
  TE: 'te-IN', TA: 'ta-IN', GU: 'gu-IN', KN: 'kn-IN',
  ML: 'ml-IN', PA: 'pa-IN', OR: 'or-IN', AS: 'as-IN', UR: 'ur-IN',
};

// Google Translate language codes for all 13 Indian languages
const GTTS_LANG: Record<string, string> = {
  EN: 'en', HI: 'hi', BN: 'bn', MR: 'mr',
  TE: 'te', TA: 'ta', GU: 'gu', KN: 'kn',
  ML: 'ml', PA: 'pa', OR: 'or', AS: 'as', UR: 'ur',
};

// Singleton audio element to avoid overlapping
let currentAudio: HTMLAudioElement | null = null;

function speakNow(code: string) {
  try {
    const text = GREETINGS[code] || GREETINGS['EN'];
    const langTag = LANG_TAGS[code] || 'en-IN';
    const gttsLang = GTTS_LANG[code] || 'en';

    // Stop any currently playing audio
    if (currentAudio) {
      try {
        currentAudio.pause();
      } catch {
        // ignore
      }
      currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Method 1: Backend TTS proxy (fetches Google TTS server-side, no CORS issues)
    const encodedText = encodeURIComponent(text);
    const proxyUrl = `/api/tts?text=${encodedText}&lang=${gttsLang}`;

    if (typeof Audio !== 'undefined') {
      const audio = new Audio(proxyUrl);
      audio.volume = 1;
      currentAudio = audio;

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Method 2: Web Speech API fallback (works for EN + HI on Windows)
          speakWebAPI(text, langTag);
        });
      }
    } else {
      speakWebAPI(text, langTag);
    }
  } catch {
    // Graceful fallback without crashing UI
  }
}


function speakWebAPI(text: string, langTag: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const trySpeak = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langTag;
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const prefix = langTag.split('-')[0];
    const best = voices.find(v => v.lang === langTag) || voices.find(v => v.lang.startsWith(prefix));
    if (best) u.voice = best;
    window.speechSynthesis.speak(u);
  };



  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    trySpeak();
  } else {
    // Voices not loaded yet — wait for the event
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      trySpeak();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Hard timeout fallback after 500ms
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      trySpeak();
    }, 500);
  }
}

export interface LanguageScreenProps {
  onSelect: (language: string) => void;
}

export function LanguageScreen({ onSelect }: LanguageScreenProps) {
  const handleSelect = (code: string) => {
    speakNow(code);
    onSelect(code);
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center w-full max-w-xl mx-auto">
      <div className="animate-slide-up">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/80 mb-2">
          <Languages size={13} /> Select Preferred Language
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 font-display tracking-tight">{t.title}</h1>
        <p className="mt-1.5 text-base text-slate-500 font-medium">{t.subtitle}</p>
      </div>

      <div className="grid w-full grid-cols-2 sm:grid-cols-3 gap-3">
        {SUPPORTED_LANGUAGES.map(({ code, nativeName, englishName }, i) => (
          <button
            key={code}
            type="button"
            onClick={() => handleSelect(code)}
            style={{ animationDelay: `${i * 30}ms` }}
            className="group relative flex flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 animate-slide-up stagger-item"
          >
            <span className="text-2xl font-bold text-slate-900 font-display group-hover:text-blue-700 transition-colors">
              {nativeName}
            </span>
            {englishName !== nativeName && (
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                {englishName}
              </span>
            )}
            <Volume2 size={13} className="absolute top-3 right-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}



