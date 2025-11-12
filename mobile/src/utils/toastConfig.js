import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from 'react-native-paper'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

const ToastContent = ({ text1, text2, type, icon }) => {
  const theme = useTheme()
  const dynamicStyles = styles(theme)

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.success || theme.colors.primary
      case 'error':
        return theme.colors.error
      case 'info':
        return theme.colors.primary
      default:
        return theme.colors.primary
    }
  }

  return (
    <View style={[dynamicStyles.container, { backgroundColor: getBackgroundColor() }]}>
      <MaterialCommunityIcons name={icon} size={24} color={theme.colors.onPrimary} />
      <View style={dynamicStyles.textContainer}>
        <Text style={dynamicStyles.title}>{text1}</Text>
        {text2 && <Text style={dynamicStyles.subtitle}>{text2}</Text>}
      </View>
    </View>
  )
}

export const toastConfig = {
  success: (props) => <ToastContent {...props} type="success" icon="check-circle" />,
  error: (props) => <ToastContent {...props} type="error" icon="close-circle" />,
  info: (props) => <ToastContent {...props} type="info" icon="information" />,
}

const styles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: theme.colors.onPrimary,
    fontSize: 14,
    marginTop: 4,
  },
})

