export const tokens = {
  color: {
    bg: {
      canvas: '#B8956A',      // Cork board
      canvasDark: '#8B6F4E',
      surface: '#F5E6C8',     // Aged paper
      elevated: '#FDFBF7',    // Clean paper
      overlay: '#2A1F15',     // Dark wood overlay
    },
    paper: {
      white: '#FDFBF7',
      aged: '#F5E6C8',
      yellow: '#FFE99A',      // Post-it
      manila: '#E8C990',      // Folder
      newsprint: '#E8E0CC',
    },
    cork: {
      light: '#C8A578',
      mid: '#B8956A',
      dark: '#8B6F4E',
    },
    border: { subtle: '#C9B89A', strong: '#8B6F4E', paper: '#D9C8A4' },
    text: {
      primary: '#1A1A1A',     // Typewriter ink
      muted: '#4A3C2E',       // Faded ink
      faded: '#7A6A52',
      onCork: '#F5E6C8',
      inverted: '#FDFBF7',
    },
    accent: { base: '#C1272D', hover: '#E63946', subtle: '#F4A8AC' },
    thread: { base: '#C1272D', shadow: 'rgba(80,10,10,0.5)' },
    pin: {
      red: '#E63946',
      redShine: '#FF6B73',
      blue: '#2D5F8B',
      blueShine: '#5A8FB8',
      yellow: '#E0AC2B',
    },
    state: { success: '#5A7D3A', warning: '#C97F1A', danger: '#8B1E1E', info: '#2D5F8B' },
    stamp: { red: '#8B1E1E', blue: '#1E3A5F' },
    node: {
      person: '#2D5F8B',
      company: '#8B6F1E',
      event: '#6B1E5F',
      evidence: '#5A7D3A',
      location: '#C97F1A',
      custom: '#4A3C2E',
    },
    rel: {
      family: '#2D5F8B',
      professional: '#4A3C2E',
      suspect: '#C1272D',
      financial: '#C97F1A',
      communication: '#5A7D3A',
      ownership: '#6B1E5F',
    },
  },
  space: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px', 12: '48px' },
  radius: { sm: '2px', md: '4px', lg: '6px', paper: '1px', full: '9999px' },
  shadow: {
    1: '0 1px 2px rgba(0,0,0,.15)',
    2: '0 4px 8px rgba(0,0,0,.25), 0 2px 3px rgba(0,0,0,.15)',
    3: '0 10px 24px rgba(0,0,0,.35), 0 4px 8px rgba(0,0,0,.2)',
    pinned: '0 6px 14px rgba(0,0,0,.3), 0 2px 4px rgba(0,0,0,.18)',
    paper: '0 2px 4px rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.12)',
    thread: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,.45))',
  },
  motion: {
    easeOut: 'cubic-bezier(.16,1,.3,1)',
    durFast: '120ms',
    durBase: '200ms',
    durSlow: '320ms',
  },
  font: {
    sans: 'var(--font-ui, "Inter"), system-ui, sans-serif',
    mono: '"JetBrains Mono", "Courier New", monospace',
    typewriter: 'var(--font-typewriter, "Special Elite"), "Courier New", monospace',
    handwritten: 'var(--font-handwritten, "Caveat"), cursive',
    serif: 'Georgia, serif',
  },
} as const;

export type Tokens = typeof tokens;
