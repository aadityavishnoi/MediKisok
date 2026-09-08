export const CLINICAL_QUESTION_GRAPH = [
    // Respiratory & Viral Prodrome
    {
        questionId: 'Q_RESP_001',
        section: 'hpi',
        questionText: 'Are you experiencing any shortness of breath or tightness in the chest while at rest?',
        questionTextLocalized: {
            en: 'Are you experiencing any shortness of breath or tightness in the chest while at rest?',
            hi: 'क्या आपको आराम करते समय भी सांस लेने में तकलीफ या सीने में जकड़न महसूस हो रही है?',
        },
        questionType: 'BOOLEAN',
        options: [
            { value: 'yes', label: 'Yes', isRedFlag: true },
            { value: 'no', label: 'No' },
        ],
        priorityScore: 0.95,
        clinicalRationale: 'Critical respiratory distress check; red-flag trigger for immediate triage escalation.',
        redFlagTrigger: true,
        relatedOutbreakDisease: 'COVID-19',
    },
    {
        questionId: 'Q_RESP_002',
        section: 'hpi',
        questionText: 'Have you noticed any sudden loss of smell (anosmia) or loss of taste?',
        questionTextLocalized: {
            en: 'Have you noticed any sudden loss of smell (anosmia) or loss of taste?',
            hi: 'क्या आपको अचानक सूंघने या स्वाद की क्षमता में कमी महसूस हुई है?',
        },
        questionType: 'BOOLEAN',
        options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
        ],
        priorityScore: 0.85,
        clinicalRationale: 'High positive likelihood ratio for acute respiratory viral infections including SARS-CoV-2.',
        redFlagTrigger: false,
        relatedOutbreakDisease: 'COVID-19',
    },
    {
        questionId: 'Q_FEV_001',
        section: 'hpi',
        questionText: 'How many days have you had the fever, and is it associated with shaking chills or sweating?',
        questionTextLocalized: {
            en: 'How many days have you had the fever, and is it associated with shaking chills or sweating?',
            hi: 'आपको कितने दिनों से बुखार है, और क्या इसके साथ कपकपी या पसीना आ रहा है?',
        },
        questionType: 'SINGLE_SELECT',
        options: [
            { value: 'less_than_3_days', label: '1 to 3 days (Acute)' },
            { value: '4_to_7_days', label: '4 to 7 days (Subacute)' },
            { value: 'more_than_7_days', label: 'More than 7 days (Prolonged)', isRedFlag: true },
        ],
        priorityScore: 0.90,
        clinicalRationale: 'Fever chronometry differentiates acute viral syndromes from persistent bacteremia/malaria/typhoid.',
        redFlagTrigger: false,
        relatedOutbreakDisease: 'Dengue',
    },
    {
        questionId: 'Q_DENGUE_001',
        section: 'outbreakSurveillance',
        questionText: 'Do you have severe pain behind the eyes (retro-orbital) or severe joint/muscle pain?',
        questionTextLocalized: {
            en: 'Do you have severe pain behind the eyes (retro-orbital) or severe joint/muscle pain?',
            hi: 'क्या आपको आंखों के पीछे तेज दर्द या जोड़ों और मांसपेशियों में गंभीर दर्द है?',
        },
        questionType: 'BOOLEAN',
        options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
        ],
        priorityScore: 0.88,
        clinicalRationale: 'Retro-orbital headache and "break-bone" arthralgia strongly suggest arboviral etiology (Dengue/Chikungunya).',
        redFlagTrigger: false,
        relatedOutbreakDisease: 'Dengue',
    },
    {
        questionId: 'Q_CARD_001',
        section: 'hpi',
        questionText: 'Does the chest pain radiate to your left arm, jaw, neck, or back?',
        questionTextLocalized: {
            en: 'Does the chest pain radiate to your left arm, jaw, neck, or back?',
            hi: 'क्या सीने का दर्द आपके बाएं हाथ, जबड़े, गर्दन या पीठ की तरफ जा रहा है?',
        },
        questionType: 'BOOLEAN',
        options: [
            { value: 'yes', label: 'Yes (Radiating)', isRedFlag: true },
            { value: 'no', label: 'No (Localized)' },
        ],
        priorityScore: 0.99,
        clinicalRationale: 'Classic radicular ischemic presentation for Acute Coronary Syndrome (ACS); immediate ECG indication.',
        redFlagTrigger: true,
        relatedOutbreakDisease: null,
    },
    {
        questionId: 'Q_GI_001',
        section: 'reviewOfSystems',
        questionText: 'Are you able to keep liquids down, or have you noticed extreme dizziness when standing up?',
        questionTextLocalized: {
            en: 'Are you able to keep liquids down, or have you noticed extreme dizziness when standing up?',
            hi: 'क्या आप पानी या तरल पदार्थ पी पा रहे हैं, या खड़े होने पर चक्कर आ रहे हैं?',
        },
        questionType: 'BOOLEAN',
        options: [
            { value: 'yes', label: 'Unable to drink / severe dizziness', isRedFlag: true },
            { value: 'no', label: 'Able to drink liquids normally' },
        ],
        priorityScore: 0.82,
        clinicalRationale: 'Evaluates hemodynamic compromise and severe dehydration secondary to gastrointestinal fluid loss.',
        redFlagTrigger: true,
        relatedOutbreakDisease: 'Cholera',
    },
];
//# sourceMappingURL=ClinicalQuestionGraph.js.map