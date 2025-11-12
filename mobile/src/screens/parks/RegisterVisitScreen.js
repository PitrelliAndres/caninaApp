import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  TextInput,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import DateTimePicker from '@react-native-community/datetimepicker'

export function RegisterVisitScreen({ route, navigation }) {
  const { park } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)

  const [visitData, setVisitData] = useState({
    date: new Date(),
    time: new Date(),
    notes: '',
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setVisitData(prev => ({ ...prev, date: selectedDate }))
    }
  }

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false)
    if (selectedTime) {
      setVisitData(prev => ({ ...prev, time: selectedTime }))
    }
  }

  const handleRegisterVisit = async () => {
    // TODO: Implement visit registration logic
    console.log('Registering visit:', { park: park.id, ...visitData })
    navigation.goBack()
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={dynamicStyles.content}>
        <Card style={dynamicStyles.parkCard}>
          <Card.Content>
            <Text variant="titleMedium" style={dynamicStyles.parkName}>
              {park.name}
            </Text>
            <Text variant="bodyMedium" style={dynamicStyles.neighborhood}>
              {park.neighborhood}
            </Text>
          </Card.Content>
        </Card>

        <Card style={dynamicStyles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('visits.details')}
            </Text>

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={dynamicStyles.dateButton}
              contentStyle={dynamicStyles.buttonContent}
            >
              {t('visits.date')}: {visitData.date.toLocaleDateString()}
            </Button>

            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={dynamicStyles.timeButton}
              contentStyle={dynamicStyles.buttonContent}
            >
              {t('visits.time')}: {visitData.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Button>

            <TextInput
              label={t('visits.notes')}
              value={visitData.notes}
              onChangeText={(text) => setVisitData(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
              style={dynamicStyles.notesInput}
            />
          </Card.Content>
        </Card>

        <View style={dynamicStyles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleRegisterVisit}
            style={dynamicStyles.registerButton}
            contentStyle={dynamicStyles.buttonContent}
          >
            {t('visits.register')}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={dynamicStyles.cancelButton}
            contentStyle={dynamicStyles.buttonContent}
          >
            {t('common.cancel')}
          </Button>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={visitData.date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={visitData.time}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: 16,
  },
  parkCard: {
    marginBottom: 16,
    elevation: 2,
  },
  parkName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  neighborhood: {
    color: theme.colors.onSurfaceVariant,
  },
  formCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 12,
  },
  timeButton: {
    marginBottom: 16,
  },
  notesInput: {
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  registerButton: {
    borderRadius: 8,
  },
  cancelButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})
