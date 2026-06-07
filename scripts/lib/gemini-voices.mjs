// gemini-tts — 30 vozes prebuilt (nomes de corpos celestes), cada uma c/ timbre.
// Multilíngue (lê PT-BR bem). Fonte: ai.google.dev/gemini-api/docs/speech-generation
// Agrupadas por caráter pra ajudar a escolher voz de personagem.

export const GEMINI_VOICES = {
  // brilhantes / energéticas
  Zephyr:        { id: 'Zephyr',        label: 'Bright' },
  Autonoe:       { id: 'Autonoe',       label: 'Bright' },
  Puck:          { id: 'Puck',          label: 'Upbeat' },
  Laomedeia:     { id: 'Laomedeia',     label: 'Upbeat' },
  Fenrir:        { id: 'Fenrir',        label: 'Excitable' },
  Sadachbia:     { id: 'Sadachbia',     label: 'Lively' },
  Pulcherrima:   { id: 'Pulcherrima',   label: 'Forward' },
  Leda:          { id: 'Leda',          label: 'Youthful' },
  // firmes / sérias / informativas
  Kore:          { id: 'Kore',          label: 'Firm' },
  Orus:          { id: 'Orus',          label: 'Firm' },
  Alnilam:       { id: 'Alnilam',       label: 'Firm' },
  Charon:        { id: 'Charon',        label: 'Informative' },
  Rasalgethi:    { id: 'Rasalgethi',    label: 'Informative' },
  Sadaltager:    { id: 'Sadaltager',    label: 'Knowledgeable' },
  Gacrux:        { id: 'Gacrux',        label: 'Mature' },
  Algenib:       { id: 'Algenib',       label: 'Gravelly' }, // ótima p/ vilão/velho
  Schedar:       { id: 'Schedar',       label: 'Even' },
  // suaves / calorosas / gentis
  Sulafat:       { id: 'Sulafat',       label: 'Warm' },
  Achernar:      { id: 'Achernar',      label: 'Soft' },
  Vindemiatrix:  { id: 'Vindemiatrix',  label: 'Gentle' },
  Achird:        { id: 'Achird',        label: 'Friendly' },
  Enceladus:     { id: 'Enceladus',     label: 'Breathy' },
  Algieba:       { id: 'Algieba',       label: 'Smooth' },
  Despina:       { id: 'Despina',       label: 'Smooth' },
  // claras / neutras / casuais
  Iapetus:       { id: 'Iapetus',       label: 'Clear' },
  Erinome:       { id: 'Erinome',       label: 'Clear' },
  Aoede:         { id: 'Aoede',         label: 'Breezy' },
  Callirrhoe:    { id: 'Callirrhoe',    label: 'Easy-going' },
  Umbriel:       { id: 'Umbriel',       label: 'Easy-going' },
  Zubenelgenubi: { id: 'Zubenelgenubi', label: 'Casual' },
};

export const GEMINI_VOICE_IDS = Object.keys(GEMINI_VOICES);
export const GEMINI_DEFAULT_VOICE = 'Sulafat'; // warm, boa p/ narração

// Tags de emoção inline (200+, lista não exaustiva — pode experimentar outras).
// Use no meio do texto: "[excited] Que incrível! [whispers] mas é segredo."
export const GEMINI_EMOTION_TAGS = [
  'excited', 'happy', 'serious', 'curious', 'amazed', 'sarcastic', 'warm',
  'whispers', 'shouting', 'laughs', 'giggles', 'crying', 'sighs', 'gasp',
  'panicked', 'tired', 'trembling', 'mischievously', 'confident', 'nervous',
];
