import type { Conversation } from '../types'

export const conversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Persistent cough & fever',
    timestamp: '2 min ago',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'I\'ve had a persistent cough for 5 days, fever up to 38.8°C, and some shortness of breath when walking. Should I be concerned?',
        fileName: 'symptoms_log.txt',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Thank you for sharing these details. I\'ve reviewed your symptoms and here is my assessment.',
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
            { condition: 'COVID-19', likelihood: 'Low-Moderate' },
            { condition: 'Upper Respiratory Tract Infection', likelihood: 'Low' },
          ],
          vitals: [
            { label: 'Temperature', value: '38.8°C', status: 'Elevated' },
            { label: 'Respiratory Rate', value: '18 bpm' },
            { label: 'O2 Saturation', value: '95%', status: 'Borderline' },
            { label: 'Heart Rate', value: '92 bpm' },
          ],
          assessment: 'Symptoms are consistent with an acute lower respiratory tract infection. The presence of fever with productive cough and mild dyspnea on exertion raises suspicion for bronchitis or early pneumonia. No signs of respiratory distress at rest. COVID-19 cannot be ruled out without testing.',
          recommendation: 'Rest and maintain hydration. Consider OTC antitussives for symptom relief. Monitor O2 saturation daily. Seek emergency care if you experience chest pain, O2 below 91%, or difficulty speaking in full sentences. Recommend COVID-19 and influenza testing. Follow up with primary care within 48 hours if no improvement.',
        },
        simple: {
          explanation: 'Your symptoms — fever, cough, and some breathlessness — suggest you may have a chest infection like bronchitis or possibly a mild pneumonia. Your oxygen level is on the lower end of normal, which needs monitoring.',
          alerts: [
            { type: 'lungs', text: 'Persistent cough with fever may indicate a lower respiratory infection' },
            { type: 'activity', text: 'Shortness of breath on exertion — monitor closely' },
            { type: 'thermometer', text: 'Fever of 38.8°C suggests active infection' },
          ],
          nextSteps: 'Rest, stay hydrated, and take fever reducers as needed. Get tested for COVID-19 and flu. If your breathing gets worse or your fever doesn\'t improve in 48 hours, see a doctor promptly.',
        },
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Chest X-ray uploaded',
    timestamp: '1 hour ago',
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'Here is my recent chest X-ray. Can you check for any abnormal findings?',
        image: {
          fileName: 'chest_pa_2026-07-03.dcm',
          findings: [
            { id: 'f1', label: 'Pleural Effusion', confidence: 94, color: 'orange', x: 18, y: 20, w: 28, h: 35 },
            { id: 'f2', label: 'Aortic Calcification', confidence: 87, color: 'blue', x: 55, y: 15, w: 20, h: 25 },
            { id: 'f3', label: 'Normal Lung Field', confidence: 99, color: 'green', x: 40, y: 55, w: 25, h: 30 },
          ],
        },
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'I\'ve analyzed the chest X-ray you provided. The AI model detected three findings on your imaging study.',
        clinical: {
          icd10: [
            { code: 'J90', description: 'Pleural effusion, not elsewhere classified' },
            { code: 'I25.1', description: 'Atherosclerotic heart disease of native coronary artery' },
          ],
          severity: { label: 'Moderate', value: 60, color: '#F59E0B' },
          differentialDiagnoses: [
            { condition: 'Left-sided Pleural Effusion', likelihood: 'High' },
            { condition: 'Aortic Arch Calcification', likelihood: 'Confirmed' },
            { condition: 'Cardiomegaly (borderline)', likelihood: 'Low' },
          ],
          vitals: [
            { label: 'CT Ratio', value: '0.52', status: 'Elevated' },
            { label: 'Lung Expansion', value: 'Normal' },
            { label: 'Costophrenic Angles', value: 'Blunted (L)' },
          ],
          assessment: 'The chest X-ray demonstrates a moderate left-sided pleural effusion with associated blunting of the costophrenic angle. Aortic arch calcification is present, consistent with atherosclerotic disease. The lung fields are otherwise clear, and cardiac silhouette is at the upper limit of normal size. No pneumothorax or acute airspace disease identified.',
          recommendation: 'Consider diagnostic thoracentesis to characterize the effusion. Follow up with echocardiogram to assess cardiac function and rule out heart failure as a potential cause. Repeat imaging in 6-8 weeks recommended following intervention.',
        },
        simple: {
          explanation: 'Your chest X-ray shows fluid buildup around your left lung and calcium deposits on your aorta (the main artery from your heart). Your lung tissue itself appears clear and healthy.',
          alerts: [
            { type: 'lungs', text: 'Fluid detected around the left lung (pleural effusion)' },
            { type: 'heart', text: 'Calcification noted on the aortic arch' },
          ],
          nextSteps: 'Your doctor may recommend draining the fluid around your lung. You should also follow up with a cardiologist regarding the calcification. These are very treatable findings.',
        },
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Lower abdominal pain',
    timestamp: 'Yesterday',
    messages: [],
  },
  {
    id: 'conv-4',
    title: 'Pre-op cardiac clearance',
    timestamp: '2 days ago',
    messages: [],
  },
  {
    id: 'conv-5',
    title: 'Worsening headaches',
    timestamp: '3 days ago',
    messages: [],
  },
]
