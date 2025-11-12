export const accent = {
  main: '#AD1457', // Rosado/Magenta primario
  soft: '#F8BBD0', // Rosado claro para fondos
  strong: '#880E4F', // Rosado oscuro para hover
}

export const secondary = {
  main: '#1B5E20', // Verde secundario
  soft: '#A5D6A7', // Verde claro
  strong: '#0D3B11', // Verde oscuro
}

export const lightPalette = {
  background: '#FAFAFA',
  surface: '#FFFFFF',

  textPrimary: '#14130E',
  textSecondary: '#7A7773',

  border: '#E6E0D5',

  placeholder: '#A8A29A',
  error: '#EF4444',
  success: secondary.main, // Verde como success

  // Primario (rosado)
  accentMain: accent.main,
  accentSoft: accent.soft,
  accentStrong: accent.strong,

  // Secundario (verde)
  secondaryMain: secondary.main,
  secondarySoft: secondary.soft,
  secondaryStrong: secondary.strong,
}

export const darkPalette = {
  background: '#0A0A0A',
  surface: '#1A1A1A',

  textPrimary: '#E8E6E3',
  textSecondary: '#A8A5A1',

  border: '#3C3A38',

  placeholder: '#6B7280',
  error: '#F97373',
  success: secondary.soft, // Verde claro como success en dark

  // Primario (rosado)
  accentMain: accent.main,
  accentSoft: accent.soft,
  accentStrong: accent.strong,

  // Secundario (verde)
  secondaryMain: secondary.main,
  secondarySoft: secondary.soft,
  secondaryStrong: secondary.strong,
}
