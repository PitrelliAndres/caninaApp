import React from 'react'
import { Button, useTheme } from 'react-native-paper'
import { StyleSheet } from 'react-native'

export function PButton({
  mode = 'contained',
  buttonColor,
  textColor,
  style,
  contentStyle,
  ...props
}) {
  const theme = useTheme()

  const finalButtonColor =
    buttonColor !== undefined
      ? buttonColor
      : mode === 'contained'
        ? theme.colors.primary
        : undefined

  const finalTextColor =
    textColor !== undefined
      ? textColor
      : mode === 'contained'
        ? theme.colors.onPrimary
        : theme.colors.primary

  return (
    <Button
      mode={mode}
      buttonColor={finalButtonColor}
      textColor={finalTextColor}
      style={[styles.button, style]}
      contentStyle={[styles.content, contentStyle]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
  },
  content: {
    paddingVertical: 6,
  },
})
