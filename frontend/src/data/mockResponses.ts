import type { ClinicalData, SimpleData } from '../types'

function uid() {
  return 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
}

const templates: { keywords: string[]; generate: () => { clinical: ClinicalData; simple: SimpleData } }[] = [
  {
    keywords: ['cough', 'fever', 'breath', 'cold', 'flu', 'chest infection', 'bronchitis', 'pneumonia'],
    generate: () => ({
      clinical: {
        icd10: [
          { code: 'R05', description: 'Cough, unspecified' },
          { code: 'R50.9', description: 'Fever, unspecified' },
          { code: 'R06.02', description: 'Shortness of breath' },
        ],
        severity: { label: 'Moderate', value: 55, color: '#F59E0B' },
        differentialDiagnoses: [
          { condition: 'Acute Bronchitis', likelihood: 'High' },
          { condition: 'Community-acquired Pneumonia', likelihood: 'Moderate' },
          { condition: 'Upper Respiratory Tract Infection', likelihood: 'Low' },
        ],
        vitals: [
          { label: 'Temperature', value: `${37.5 + Math.round(Math.random() * 15) / 10}°C`, status: 'Elevated' },
          { label: 'Respiratory Rate', value: `${16 + Math.floor(Math.random() * 6)} bpm` },
          { label: 'O2 Saturation', value: `${94 + Math.floor(Math.random() * 4)}%`, status: 'Borderline' },
          { label: 'Heart Rate', value: `${80 + Math.floor(Math.random() * 20)} bpm` },
        ],
        assessment: 'Symptoms are consistent with an acute lower respiratory tract infection. The presence of fever with productive cough and mild dyspnea raises suspicion for bronchitis or early pneumonia. No signs of respiratory distress at rest.',
        recommendation: 'Rest and maintain hydration. Consider OTC antitussives for symptom relief. Monitor temperature and O2 saturation. Seek emergency care if chest pain, O2 below 91%, or difficulty speaking in full sentences. Follow up with primary care within 48 hours if no improvement.',
      },
      simple: {
        explanation: 'Your symptoms — fever, cough, and some breathlessness — suggest you may have a chest infection like bronchitis or possibly a mild pneumonia. Your oxygen level is on the lower end of normal, which needs monitoring.',
        alerts: [
          { type: 'lungs', text: 'Persistent cough with fever may indicate a lower respiratory infection' },
          { type: 'thermometer', text: 'Fever suggests active infection — monitor closely' },
        ],
        nextSteps: 'Rest, stay hydrated, and take fever reducers as needed. Get tested for flu/COVID-19. If breathing worsens or fever persists beyond 48 hours, see a doctor.',
      },
    }),
  },
  {
    keywords: ['pain', 'ache', 'hurt', 'stomach', 'abdominal', 'back', 'headache', 'migraine'],
    generate: () => {
      const isHeadache = Math.random() > 0.5
      return {
        clinical: {
          icd10: isHeadache
            ? [{ code: 'R51', description: 'Headache, unspecified' }, { code: 'G43.9', description: 'Migraine, unspecified' }]
            : [{ code: 'R10.9', description: 'Unspecified abdominal pain' }, { code: 'K30', description: 'Functional dyspepsia' }],
          severity: { label: 'Mild to Moderate', value: 40, color: '#F59E0B' },
          differentialDiagnoses: isHeadache
            ? [
                { condition: 'Tension-type Headache', likelihood: 'High' },
                { condition: 'Migraine without Aura', likelihood: 'Moderate' },
                { condition: 'Cervicogenic Headache', likelihood: 'Low' },
              ]
            : [
                { condition: 'Gastritis / Dyspepsia', likelihood: 'High' },
                { condition: 'Irritable Bowel Syndrome', likelihood: 'Moderate' },
                { condition: 'Gastroenteritis', likelihood: 'Low' },
              ],
          vitals: [
            { label: 'Pain Level', value: `${4 + Math.floor(Math.random() * 4)}/10` },
            { label: 'Duration', value: `${1 + Math.floor(Math.random() * 5)} days` },
            { label: 'Heart Rate', value: `${70 + Math.floor(Math.random() * 16)} bpm` },
          ],
          assessment: isHeadache
            ? 'The reported headache pattern is consistent with tension-type headache or possible migraine. No red flag symptoms such as sudden onset, neurological deficits, or fever suggest a benign etiology. Stress and fatigue may be contributing factors.'
            : 'Abdominal pain is most consistent with gastritis or functional dyspepsia. No signs of acute abdomen or peritonitis. Diet, stress, and medication use are potential contributing factors.',
          recommendation: isHeadache
            ? 'Rest in a dark, quiet room. Stay hydrated. Consider OTC analgesics (acetaminophen or ibuprofen). Keep a headache diary. Seek care if headache is sudden/severe, accompanied by stiff neck, fever, or vision changes.'
            : 'Eat small, bland meals. Avoid spicy/fatty foods. Consider OTC antacids. Monitor symptoms. Seek care if pain becomes severe, you have persistent vomiting, fever, or blood in stool.',
        },
        simple: {
          explanation: isHeadache
            ? 'Your headache pattern appears consistent with common tension headaches or possibly migraines. No concerning signs detected based on the information provided.'
            : 'Your abdominal discomfort appears related to digestion or stomach irritation. Based on your description, this is likely a mild to moderate issue.',
          alerts: isHeadache
            ? [{ type: 'brain', text: 'Headaches may be tension-related or migrainous — keep a symptom diary' }]
            : [{ type: 'activity', text: 'Abdominal discomfort consistent with gastritis or dyspepsia' }],
          nextSteps: isHeadache
            ? 'Rest and hydration are key. Over-the-counter pain relief can help. If headaches become more frequent or severe, consult a healthcare provider.'
            : 'Try a bland diet and monitor your symptoms. If pain persists more than a few days or worsens, consult a healthcare provider.',
        },
      }
    },
  },
  {
    keywords: ['x-ray', 'xray', 'x ray', 'chest', 'dicom', 'scan', 'mri', 'ct scan', 'imaging', 'image', 'upload', 'result'],
    generate: () => ({
      clinical: {
        icd10: [
          { code: 'J90', description: 'Pleural effusion, not elsewhere classified' },
          { code: 'I25.1', description: 'Atherosclerotic heart disease of native coronary artery' },
        ],
        severity: { label: 'Moderate', value: 60, color: '#F59E0B' },
        differentialDiagnoses: [
          { condition: 'Pleural Effusion (unilateral)', likelihood: 'High' },
          { condition: 'Aortic Arch Calcification', likelihood: 'Confirmed' },
          { condition: 'Cardiomegaly (borderline)', likelihood: 'Low' },
        ],
        vitals: [
          { label: 'CT Ratio', value: '0.52', status: 'Elevated' },
          { label: 'Lung Expansion', value: 'Normal' },
          { label: 'Costophrenic Angles', value: 'Blunted (L)' },
        ],
        assessment: 'Imaging demonstrates a moderate unilateral pleural effusion with associated blunting of the costophrenic angle. Aortic arch calcification is present, consistent with atherosclerotic disease. Lung fields are otherwise clear. No pneumothorax or acute airspace disease identified.',
        recommendation: 'Consider diagnostic thoracentesis to characterize the effusion. Follow up with echocardiogram to assess cardiac function. Repeat imaging in 6-8 weeks recommended following intervention.',
      },
      simple: {
        explanation: 'Your imaging shows fluid buildup in the chest cavity and calcium deposits on the aorta (the main artery from your heart). The lung tissue itself appears clear and healthy.',
        alerts: [
          { type: 'lungs', text: 'Fluid detected in the chest cavity (pleural effusion)' },
          { type: 'heart', text: 'Calcification noted on the aortic arch' },
        ],
        nextSteps: 'Your doctor may recommend draining the fluid. You should also follow up regarding the calcification findings. These are common and very treatable.',
      },
    }),
  },
  {
    keywords: ['skin', 'rash', 'itch', 'swelling', 'allergy', 'hives', 'redness'],
    generate: () => ({
      clinical: {
        icd10: [
          { code: 'R21', description: 'Rash and other nonspecific skin eruption' },
          { code: 'L50.9', description: 'Urticaria, unspecified' },
        ],
        severity: { label: 'Mild', value: 25, color: '#22C55E' },
        differentialDiagnoses: [
          { condition: 'Allergic Reaction / Urticaria', likelihood: 'High' },
          { condition: 'Contact Dermatitis', likelihood: 'Moderate' },
          { condition: 'Viral Exanthem', likelihood: 'Low' },
        ],
        vitals: [
          { label: 'Affected Area', value: 'Localized' },
          { label: 'Onset', value: `${Math.floor(Math.random() * 48) + 1}h ago` },
        ],
        assessment: 'The described skin changes are most consistent with an allergic reaction or contact dermatitis. No signs of anaphylaxis or systemic involvement. If associated with new medications, foods, or environmental exposures, these are likely triggers.',
        recommendation: 'Discontinue any suspected triggers. Apply cool compresses for itching. Consider OTC antihistamines (cetirizine or loratadine). Seek emergency care if accompanied by difficulty breathing, throat swelling, or dizziness.',
      },
      simple: {
        explanation: 'Your skin symptoms appear to be an allergic reaction or irritation from something that touched your skin. This is typically mild and manageable at home.',
        alerts: [
          { type: 'activity', text: 'Skin irritation consistent with allergic reaction or contact dermatitis' },
        ],
        nextSteps: 'Avoid scratching. Try an over-the-counter antihistamine. If the rash spreads or you have trouble breathing, seek emergency care immediately.',
      },
    }),
  },
]

const defaultTemplate = {
  clinical: {
    icd10: [
      { code: 'R69', description: 'Illness, unspecified' },
    ],
    severity: { label: 'Mild', value: 20, color: '#22C55E' },
    differentialDiagnoses: [
      { condition: 'General Medical Assessment', likelihood: 'High' },
      { condition: 'Further Evaluation Needed', likelihood: 'Moderate' },
    ],
    vitals: [
      { label: 'Heart Rate', value: `${72 + Math.floor(Math.random() * 16)} bpm` },
      { label: 'Temperature', value: '36.9°C' },
    ],
    assessment: 'Based on the information provided, a general assessment has been completed. No specific red flag symptoms identified. Further details would help refine the differential diagnosis and recommendations.',
    recommendation: 'Monitor your symptoms and provide additional details for a more specific assessment. If symptoms worsen or new concerning symptoms develop, seek medical attention.',
  },
  simple: {
    explanation: 'I\'ve reviewed the information you provided. To give you a more specific assessment, additional details about your symptoms would be helpful.',
    alerts: [
      { type: 'activity', text: 'General assessment completed — more details needed for specific analysis' },
    ],
    nextSteps: 'Please provide more details about your symptoms, including when they started, severity, and any other relevant information.',
  },
}

export function getMockResponse(text: string) {
  const lower = text.toLowerCase()
  for (const t of templates) {
    if (t.keywords.some(k => lower.includes(k))) {
      return t.generate()
    }
  }
  return defaultTemplate
}

export function createUserMessage(text: string, fileName?: string) {
  return {
    id: uid(),
    role: 'user' as const,
    content: text,
    ...(fileName ? { fileName } : {}),
  }
}

export function createAssistantMessage(text: string, data: { clinical: ClinicalData; simple: SimpleData }) {
  return {
    id: uid(),
    role: 'assistant' as const,
    content: text,
    ...data,
  }
}
