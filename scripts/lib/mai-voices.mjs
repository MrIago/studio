// mai-voice-2 — catálogo completo: 48 vozes em 18 idiomas, com estilos expressivos
// por voz + speed. Copiado do catálogo da Lasy (testado param a param).
// ID = `<locale>-<Name>:MAI-Voice-2`. style válido POR voz (vazio = neutro).

// Conjuntos de estilos expressivos (variam por voz).
const FULL = ['angry','confused','determined','disgusted','embarrassed','excited','fearful','happy','hopeful','jealous','joyful','regretful','relieved','sad','shouting','softvoice','surprised','whispering'];
const HARPER = ['angry','confused','determined','embarrassed','excited','happy','hopeful','joyful','regretful','relieved','sad','shouting','softvoice','whispering'];
const NARRATIVE = ['adventurous','caring','empathy','curious','encouraging','excited','friendly','cheerful','nostalgic','reflective','sad','disappointed','serious'];
const PT_PED = ['confused','determined','embarrassed','excited','happy','hopeful','joyful','regretful','relieved','sad','softvoice','surprised'];
const PT_RAF = ['angry','confused','determined','embarrassed','excited','happy','hopeful','joyful','regretful','relieved','sad','softvoice','surprised'];
const HI_ARJUN = ['angry','confused','disgusted','embarrassed','excited','fearful','happy','hopeful','jealous','joyful','regretful','sad','surprised'];
const KO_HANA = ['angry','confused','determined','embarrassed','excited','happy','hopeful','joyful','regretful','relieved','sad','softvoice','surprised'];
const KO_JUNHO = ['angry','confused','determined','embarrassed','excited','happy','hopeful','joyful','relieved','sad','softvoice'];
const ZH_LAN = ['angry','confused','disgusted','embarrassed','excited','fearful','happy','joyful','sad','surprised'];

const v = (id, name, gender, styles = []) => ({ id: `${id}:MAI-Voice-2`, name, gender, styles });

// 18 idiomas, 48 vozes. PT-BR primeiro.
export const MAI_LANGUAGES = [
  { locale: 'pt-BR', label: 'Português (Brasil)', voices: [
    v('pt-BR-Luana','Luana','F',FULL), v('pt-BR-Caio','Caio','M',FULL),
    v('pt-BR-Pedro','Pedro','M',PT_PED), v('pt-BR-Rafael','Rafael','M',PT_RAF) ] },
  { locale: 'en-US', label: 'Inglês (EUA)', voices: [
    v('en-US-Ethan','Ethan','M',FULL), v('en-US-Olivia','Olivia','F',FULL),
    v('en-US-Harper','Harper','F',HARPER), v('en-US-Grant','Grant','M'),
    v('en-US-Iris','Iris','F'), v('en-US-Jasper','Jasper','M') ] },
  { locale: 'en-AU', label: 'Inglês (Austrália)', voices: [v('en-AU-Lisa','Lisa','F',FULL)] },
  { locale: 'es-ES', label: 'Espanhol (Espanha)', voices: [v('es-ES-Marta','Marta','F',NARRATIVE)] },
  { locale: 'es-MX', label: 'Espanhol (México)', voices: [
    v('es-MX-Alejo','Alejo','M',FULL), v('es-MX-Valeria','Valeria','F',FULL) ] },
  { locale: 'fr-FR', label: 'Francês (França)', voices: [
    v('fr-FR-Marc','Marc','M',FULL), v('fr-FR-Soleil','Soleil','F',FULL) ] },
  { locale: 'de-DE', label: 'Alemão (Alemanha)', voices: [
    v('de-DE-Klaus','Klaus','M',FULL), v('de-DE-Mia','Mia','F',FULL) ] },
  { locale: 'it-IT', label: 'Italiano (Itália)', voices: [
    v('it-IT-Luca','Luca','M',FULL), v('it-IT-Rosa','Rosa','F',FULL) ] },
  { locale: 'hi-IN', label: 'Hindi (Índia)', voices: [
    v('hi-IN-Dhruv','Dhruv','M',FULL), v('hi-IN-Kavya','Kavya','F',FULL),
    v('hi-IN-Priya','Priya','F',FULL), v('hi-IN-Arjun','Arjun','M',HI_ARJUN) ] },
  { locale: 'ko-KR', label: 'Coreano (Coreia)', voices: [
    v('ko-KR-Hana','Hana','F',KO_HANA), v('ko-KR-Junho','Junho','M',KO_JUNHO) ] },
  { locale: 'zh-CN', label: 'Chinês (Mandarim)', voices: [
    v('zh-CN-Bo','Bo','M',FULL), v('zh-CN-Mei','Mei','F',FULL), v('zh-CN-Lan','Lan','F',ZH_LAN) ] },
  { locale: 'ru-RU', label: 'Russo (Rússia)', voices: [
    v('ru-RU-Lev','Lev','M',NARRATIVE), v('ru-RU-Masha','Masha','F',NARRATIVE) ] },
  { locale: 'tr-TR', label: 'Turco (Turquia)', voices: [
    v('tr-TR-Aydin','Aydin','M',NARRATIVE), v('tr-TR-Elif','Elif','F',NARRATIVE) ] },
  { locale: 'th-TH', label: 'Tailandês (Tailândia)', voices: [
    v('th-TH-Krit','Krit','M',NARRATIVE), v('th-TH-Nattapong','Nattapong','M',NARRATIVE) ] },
  { locale: 'nl-NL', label: 'Holandês (Países Baixos)', voices: [
    v('nl-NL-Sander','Sander','M',NARRATIVE), v('nl-NL-Fleur','Fleur','F') ] },
  { locale: 'pt-PT', label: 'Português (Portugal)', voices: [v('pt-PT-Rui','Rui','M',PT_PED)] },
  { locale: 'ro-RO', label: 'Romeno (Romênia)', voices: [
    v('ro-RO-Andrei','Andrei','M'), v('ro-RO-Radu','Radu','M'),
    v('ro-RO-Elena','Elena','F'), v('ro-RO-Ioana','Ioana','F') ] },
  { locale: 'hu-HU', label: 'Húngaro (Hungria)', voices: [
    v('hu-HU-Bence','Bence','M'), v('hu-HU-Levente','Levente','M'),
    v('hu-HU-Lilla','Lilla','F'), v('hu-HU-Réka','Réka','F') ] },
];

export const MAI_VOICE_IDS = MAI_LANGUAGES.flatMap((l) => l.voices.map((vc) => vc.id));
export const MAI_DEFAULT_VOICE = 'pt-BR-Luana:MAI-Voice-2';

// lookup rápido id → voz (pra validar style)
export const MAI_VOICE_BY_ID = Object.fromEntries(
  MAI_LANGUAGES.flatMap((l) => l.voices.map((vc) => [vc.id, vc])),
);
