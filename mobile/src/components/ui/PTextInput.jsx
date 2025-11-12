import React from 'react'
import { TextInput, useTheme } from 'react-native-paper'

export function PTextInput({
  mode = 'outlined',
  activeOutlineColor,
  outlineColor,
  placeholderTextColor,
  textColor,
  ...props
}) {
  const theme = useTheme()

  return (
    <TextInput
      mode={mode}
      activeOutlineColor={activeOutlineColor || theme.colors.primary}
      outlineColor={outlineColor || theme.colors.outline}
      placeholderTextColor={placeholderTextColor || theme.colors.placeholder}
      textColor={textColor || theme.colors.text}
      {...props}
    />
  )
}
