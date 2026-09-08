/**
 * MediKiosk Clinical AI - Clinical Question Graph
 * Graph network of canonical clinical questions, clinical rationales,
 * symptom associations, and differential-diagnosis evidence linkages.
 */

import { CanonicalQuestion } from '../schemas/question_schema';

export const CLINICAL_QUESTION_GRAPH: CanonicalQuestion[] = [
  // Respiratory
  {
    id: 'RESP_001',
    text: 'Are you experiencing difficulty breathing?',
    textLocalized: {
      en: 'Are you experiencing difficulty breathing?',
      hi: 'क्या आपको सांस लेने में तकलीफ या सांस फूलने की समस्या हो रही है?',
    },
    category: 'RESPIRATORY',
    priority: 'HIGH',
    baseScore: 0.95,
    redFlag: true,
    differentialCodes: ['COVID-19', 'PNEUMONIA', 'ASTHMA', 'PULMONARY_EMBOLISM'],
    relatedOutbreakDisease: 'COVID-19',
    clinicalRationale:
      'Shortness of breath is a critical triage red flag indicating potential acute hypoxemia or respiratory compromise.',
    relevantSymptomCodes: ['DYSPNEA_ACUTE', 'COUGH_ACUTE', 'FEVER_ACUTE', 'PHARYNGITIS_ACUTE'],
    options: [
      { value: 'yes', label: 'Yes, experiencing breathlessness', isRedFlag: true },
      { value: 'no', label: 'No, breathing normally' },
    ],
  },
  {
    id: 'RESP_002',
    text: 'How long have you had this cough, and is it producing yellow or green phlegm?',
    textLocalized: {
      en: 'How long have you had this cough, and is it producing yellow or green phlegm?',
      hi: 'आपको कितने दिनों से खांसी है, और क्या इसके साथ बलगम आ रहा है?',
    },
    category: 'RESPIRATORY',
    priority: 'MEDIUM',
    baseScore: 0.80,
    redFlag: false,
    differentialCodes: ['BRONCHITIS', 'PNEUMONIA', 'VIRAL_URTI', 'COVID-19'],
    relatedOutbreakDisease: 'COVID-19',
    clinicalRationale:
      'Cough chronometry and purulence distinguish acute viral tracheobronchitis from bacterial lower respiratory tract infections.',
    relevantSymptomCodes: ['COUGH_ACUTE', 'FEVER_ACUTE', 'PHARYNGITIS_ACUTE'],
    options: [
      { value: 'dry_under_week', label: 'Dry cough for less than a week' },
      { value: 'productive_phlegm', label: 'Productive with yellow/green phlegm' },
      { value: 'chronic_over_3_weeks', label: 'Chronic cough lasting over 3 weeks', isRedFlag: true },
      { value: 'no_cough', label: 'No cough' },
    ],
  },
  {
    id: 'RESP_003',
    text: 'Have you noticed any sudden loss of smell (anosmia) or loss of taste?',
    textLocalized: {
      en: 'Have you noticed any sudden loss of smell (anosmia) or loss of taste?',
      hi: 'क्या आपको अचानक सूंघने या स्वाद की क्षमता में कमी महसूस हुई है?',
    },
    category: 'RESPIRATORY',
    priority: 'MEDIUM',
    baseScore: 0.75,
    redFlag: false,
    differentialCodes: ['COVID-19', 'POST_VIRAL_RHINITIS'],
    relatedOutbreakDisease: 'COVID-19',
    clinicalRationale:
      'Sudden chemosensory loss carries high specificity for acute viral respiratory infections, specifically SARS-CoV-2 variants.',
    relevantSymptomCodes: ['FEVER_ACUTE', 'COUGH_ACUTE', 'PHARYNGITIS_ACUTE', 'LOSS_OF_SMELL', 'LOSS_OF_TASTE'],
    options: [
      { value: 'yes', label: 'Yes, sudden loss of smell or taste' },
      { value: 'no', label: 'No change in smell or taste' },
    ],
  },

  // Cardiovascular
  {
    id: 'CARD_001',
    text: 'Does the chest pain radiate to your left arm, shoulder, neck, or jaw?',
    textLocalized: {
      en: 'Does the chest pain radiate to your left arm, shoulder, neck, or jaw?',
      hi: 'क्या सीने का दर्द आपके बाएं हाथ, कंधे, गर्दन या जबड़े की तरफ फैल रहा है?',
    },
    category: 'CARDIOVASCULAR',
    priority: 'CRITICAL',
    baseScore: 0.99,
    redFlag: true,
    differentialCodes: ['ACUTE_CORONARY_SYNDROME', 'ANGINA_PECTORIS', 'AORTIC_DISSECTION'],
    relatedOutbreakDisease: null,
    clinicalRationale:
      'Radiation of precordial discomfort to the left arm or jaw carries a positive likelihood ratio >2.5 for acute myocardial infarction.',
    relevantSymptomCodes: ['PRECORDIAL_CHEST_PAIN', 'CARDIAC_PALPITATIONS', 'DYSPNEA_ACUTE'],
    options: [
      { value: 'yes_radiating', label: 'Yes, pain radiates to arm/jaw/neck', isRedFlag: true },
      { value: 'no_localized', label: 'No, pain is strictly localized or musculoskeletal' },
    ],
  },
  {
    id: 'CARD_002',
    text: 'Does the chest discomfort feel like intense pressure, squeezing, or heaviness, accompanied by cold sweat?',
    textLocalized: {
      en: 'Does the chest discomfort feel like intense pressure, squeezing, or heaviness, accompanied by cold sweat?',
      hi: 'क्या सीने में भारी दबाव या जकड़न के साथ ठंडा पसीना आ रहा है?',
    },
    category: 'CARDIOVASCULAR',
    priority: 'CRITICAL',
    baseScore: 0.96,
    redFlag: true,
    differentialCodes: ['ACUTE_CORONARY_SYNDROME', 'MYOCARDIAL_INFARCTION'],
    relatedOutbreakDisease: null,
    clinicalRationale:
      'Diaphoresis paired with retrosternal pressure strongly correlates with sympathetic overdrive during acute cardiac ischemia.',
    relevantSymptomCodes: ['PRECORDIAL_CHEST_PAIN'],
    options: [
      { value: 'yes_pressure_sweating', label: 'Yes, crushing pressure with sweating', isRedFlag: true },
      { value: 'no', label: 'No' },
    ],
  },

  // Constitutional / Fever
  {
    id: 'FEV_001',
    text: 'How many days have you had the fever, and is it continuous or coming in spikes with chills?',
    textLocalized: {
      en: 'How many days have you had the fever, and is it continuous or coming in spikes with chills?',
      hi: 'आपको कितने दिनों से बुखार है, और क्या इसके साथ तेज कपकपी या पसीना आ रहा है?',
    },
    category: 'CONSTITUTIONAL',
    priority: 'MEDIUM',
    baseScore: 0.88,
    redFlag: false,
    differentialCodes: ['VIRAL_SYNDROME', 'MALARIA', 'TYPHOID', 'DENGUE'],
    relatedOutbreakDisease: 'Dengue',
    clinicalRationale:
      'Fever periodicity (continuous vs step-ladder vs intermittent with rigors) is the prime differentiator for tropical febrile illness.',
    relevantSymptomCodes: ['FEVER_ACUTE', 'RIGORS_CHILLS', 'MALAISE_FATIGUE'],
    options: [
      { value: 'acute_1_to_3_days', label: '1 to 3 days (Acute)' },
      { value: 'subacute_4_to_7_days', label: '4 to 7 days (Persistent)' },
      { value: 'prolonged_over_7_days', label: 'Over 7 days (Prolonged)', isRedFlag: true },
    ],
  },
  {
    id: 'FEV_002',
    text: 'Have you experienced shaking chills or teeth-chattering rigors?',
    textLocalized: {
      en: 'Have you experienced shaking chills or teeth-chattering rigors?',
      hi: 'क्या आपको दांत किटकिटाने वाली तेज ठंड या कपकपी महसूस हुई है?',
    },
    category: 'CONSTITUTIONAL',
    priority: 'MEDIUM',
    baseScore: 0.82,
    redFlag: false,
    differentialCodes: ['MALARIA', 'BACTEREMIA', 'PYELONEPHRITIS', 'DENGUE'],
    relatedOutbreakDisease: 'Dengue',
    clinicalRationale:
      'True rigors denote rapid temperature escalation seen in bacteremic episodes or intra-erythrocytic schizogony.',
    relevantSymptomCodes: ['FEVER_ACUTE', 'RIGORS_CHILLS'],
    options: [
      { value: 'yes', label: 'Yes, shaking chills' },
      { value: 'no', label: 'No chills' },
    ],
  },

  // Arboviral / Dengue
  {
    id: 'DENGUE_001',
    text: 'Do you have severe pain behind your eyes (retro-orbital) or severe joint/muscle pain?',
    textLocalized: {
      en: 'Do you have severe pain behind your eyes (retro-orbital) or severe joint/muscle pain?',
      hi: 'क्या आपको आंखों के पीछे तेज दर्द या जोड़ों व मांसपेशियों में असहनीय दर्द है?',
    },
    category: 'CONSTITUTIONAL',
    priority: 'HIGH',
    baseScore: 0.85,
    redFlag: false,
    differentialCodes: ['DENGUE_FEVER', 'CHIKUNGUNYA', 'ACUTE_VIRAL_SYNDROME'],
    relatedOutbreakDisease: 'Dengue',
    clinicalRationale:
      'Retro-orbital headache paired with severe arthralgia ("break-bone fever") is hallmark evidence for arboviral infection.',
    relevantSymptomCodes: ['FEVER_ACUTE', 'RIGORS_CHILLS', 'JOINT_PAIN', 'CEPHALEA_HEADACHE'],
    options: [
      { value: 'yes', label: 'Yes, severe eye pain or joint aching' },
      { value: 'no', label: 'No unusual eye or bone pain' },
    ],
  },

  // Gastrointestinal
  {
    id: 'GI_001',
    text: 'Are you able to keep liquids down without vomiting, and have you felt severe lightheadedness upon standing?',
    textLocalized: {
      en: 'Are you able to keep liquids down without vomiting, and have you felt severe lightheadedness upon standing?',
      hi: 'क्या आप पानी या तरल पदार्थ पी पा रहे हैं, या खड़े होने पर चक्कर आ रहे हैं?',
    },
    category: 'GASTROINTESTINAL',
    priority: 'HIGH',
    baseScore: 0.84,
    redFlag: true,
    differentialCodes: ['ACUTE_GASTROENTERITIS', 'HYPOVOLEMIC_DEHYDRATION', 'CHOLERA'],
    relatedOutbreakDisease: 'Cholera',
    clinicalRationale:
      'Persistent emesis preventing oral rehydration causes rapid hemodynamic collapse, requiring urgent IV fluids.',
    relevantSymptomCodes: ['EMESIS_VOMITING', 'DIARRHEA_ACUTE', 'ABDOMINAL_PAIN_UNSPECIFIED'],
    options: [
      { value: 'unable_to_drink', label: 'Unable to keep liquids down / severe dizzy spells', isRedFlag: true },
      { value: 'able_to_hydrate', label: 'Able to drink liquids normally' },
    ],
  },
  {
    id: 'GI_002',
    text: 'Do you have severe localized abdominal pain, especially in the lower right abdomen?',
    textLocalized: {
      en: 'Do you have severe localized abdominal pain, especially in the lower right abdomen?',
      hi: 'क्या पेट में विशेष रूप से निचले दाहिने हिस्से में बहुत तेज दर्द है?',
    },
    category: 'GASTROINTESTINAL',
    priority: 'HIGH',
    baseScore: 0.86,
    redFlag: true,
    differentialCodes: ['ACUTE_APPENDICITIS', 'PERITONITIS', 'BOWEL_OBSTRUCTION'],
    relatedOutbreakDisease: null,
    clinicalRationale:
      'Right lower quadrant pain with focal guarding suggests acute surgical abdomen (appendicitis).',
    relevantSymptomCodes: ['ABDOMINAL_PAIN_UNSPECIFIED', 'EMESIS_VOMITING'],
    options: [
      { value: 'yes_severe_rlq', label: 'Yes, severe right lower quadrant pain', isRedFlag: true },
      { value: 'no_diffuse_mild', label: 'No, mild or diffuse stomach discomfort' },
    ],
  },

  // Neurological
  {
    id: 'NEURO_001',
    text: 'Is your headache accompanied by a stiff neck, high fever, or sensitivity to light?',
    textLocalized: {
      en: 'Is your headache accompanied by a stiff neck, high fever, or sensitivity to light?',
      hi: 'क्या सिरदर्द के साथ गर्दन में अकड़न, तेज बुखार या रोशनी से परेशानी हो रही है?',
    },
    category: 'NEUROLOGICAL',
    priority: 'CRITICAL',
    baseScore: 0.94,
    redFlag: true,
    differentialCodes: ['BACTERIAL_MENINGITIS', 'ENCEPHALITIS', 'SUBARACHNOID_HEMORRHAGE'],
    relatedOutbreakDisease: null,
    clinicalRationale:
      'Meningismus triad (fever, nuchal rigidity, altered mentation/photophobia) warrants emergency lumbar puncture and antibiotics.',
    relevantSymptomCodes: ['CEPHALEA_HEADACHE', 'FEVER_ACUTE'],
    options: [
      { value: 'yes_stiff_neck', label: 'Yes, headache with stiff neck / photophobia', isRedFlag: true },
      { value: 'no', label: 'No neck stiffness' },
    ],
  },
];
