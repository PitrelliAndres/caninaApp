import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={[styles.container, styles.success]}>
      <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={[styles.container, styles.error]}>
      <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={[styles.container, styles.info]}>
      <MaterialCommunityIcons name="information" size={24} color="#fff" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.subtitle}>{text2}</Text>}
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  success: {
    backgroundColor: '#10b981',
  },
  error: {
    backgroundColor: '#ef4444',
  },
  info: {
    backgroundColor: '#3b82f6',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
})

