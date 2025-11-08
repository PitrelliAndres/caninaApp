import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Menu, IconButton, useTheme } from 'react-native-paper'
import { useTranslation } from 'react-i18next'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const theme = useTheme()
  const [visible, setVisible] = useState(false)

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language)

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode)
    setVisible(false)
  }

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <IconButton
          icon="web"
          size={24}
          onPress={() => setVisible(true)}
          style={styles.button}
        />
      }
    >
      {languages.map((lang) => (
        <Menu.Item
          key={lang.code}
          onPress={() => handleLanguageChange(lang.code)}
          title={`${lang.flag} ${lang.name}`}
          style={i18n.language === lang.code ? styles.activeItem : null}
        />
      ))}
    </Menu>
  )
}

const styles = StyleSheet.create({
  button: {
    margin: 0,
  },
  activeItem: {
    backgroundColor: '#e3f2fd',
  },
})
