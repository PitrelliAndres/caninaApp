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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.parkCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.parkName}>
              {park.name}
            </Text>
            <Text variant="bodyMedium" style={styles.neighborhood}>
              {park.neighborhood}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('visits.details')}
            </Text>

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              contentStyle={styles.buttonContent}
            >
              {t('visits.date')}: {visitData.date.toLocaleDateString()}
            </Button>

            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={styles.timeButton}
              contentStyle={styles.buttonContent}
            >
              {t('visits.time')}: {visitData.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Button>

            <TextInput
              label={t('visits.notes')}
              value={visitData.notes}
              onChangeText={(text) => setVisitData(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleRegisterVisit}
            style={styles.registerButton}
            contentStyle={styles.buttonContent}
          >
            {t('visits.register')}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#666',
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