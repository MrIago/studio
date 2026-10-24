// Cores e medidas do vídeo: o rascunho do quadro (Excalidraw) com a assinatura da AdzHub.
// Pastéis = significado (azul plataforma/agência, verde liberado, amarelo regra, rosa risco,
// lilás módulo, pêssego cliente, turquesa unidade). Laranja da marca só em destaque.

export const FPS = 30

export const PAPER = '#FBFAF6'
export const INK = '#2B2B2B'
export const INK_SOFT = '#6B6B6B'
export const INK_FAINT = '#B8B4AC'

export const PASTEL = {
    azul: '#A5D8FF',
    azulClaro: '#E7F5FF',
    verde: '#B2F2BB',
    amarelo: '#FFEC99',
    rosa: '#FFC9C9',
    lilas: '#D0BFFF',
    pessego: '#FFD8A8',
    turquesa: '#99E9F2',
    cinza: '#F1F3F5',
    branco: '#FFFFFF',
} as const

export const TINTA = {
    azul: '#1971C2',
    verde: '#2F9E44',
    vermelho: '#E03131',
    laranja: '#F08C00',
} as const

// a marca (do produto): azul-marinho e o laranja do símbolo
export const BRAND = { navy: '#1F2A56', orange: '#F7931E', bege: '#F4EFE6' } as const

export const HAND = 'Virgil, "Segoe Print", cursive'
export const MONO = '"JetBrains Mono", "DejaVu Sans Mono", monospace'

export const sec = (s: number) => Math.round(s * FPS)
