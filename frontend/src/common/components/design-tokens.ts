/**
 * Design tokens for consistent styling across the application
 */

export const colors = {
  hasenBase: '#F5E6D3',
  hasenDark: '#2C1810',
  hasenGreen: '#4A7C59',
  hasenRed: '#C84B31',
  hasenYellow: '#F4A261',
  hasenBlue: '#2A9D8F',
} as const

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
} as const

export const borderRadius = {
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  full: '9999px',
} as const

export const fontSize = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
} as const

export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '400ms',
} as const

export const zIndex = {
  base: 0,
  dropdown: 10,
  modal: 50,
  tooltip: 100,
  notification: 1000,
} as const
