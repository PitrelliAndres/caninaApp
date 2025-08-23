import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  Chip,
  useTheme,
} from 'react-native-paper'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

const { width } = Dimensions.get('window')

export function ParkDetailScreen({ route, navigation }) {
  const { park } = route.params
  const { t } = useTranslation()
  const theme = useTheme()

  const handleRegisterVisit = () => {
    navigation.navigate('RegisterVisit', { park })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: park.latitude,
            longitude: park.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker
            coordinate={{
              latitude: park.latitude,
              longitude: park.longitude,
            }}
            title={park.name}
            description={park.neighborhood}
          />
        </MapView>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.parkName}>
              {park.name}
            </Text>
            
            <Text variant="bodyMedium" style={styles.neighborhood}>
              {park.neighborhood}
            </Text>

            {park.description && (
              <Text variant="bodyMedium" style={styles.description}>
                {park.description}
              </Text>
            )}

            <View style={styles.featuresContainer}>
              {park.hasArea && (
                <Chip icon="run" style={styles.chip}>
                  {t('parks.hasArea')}
                </Chip>
              )}
              {park.isFenced && (
                <Chip icon="fence" style={styles.chip}>
                  {t('parks.isFenced')}
                </Chip>
              )}
              {park.hasWater && (
                <Chip icon="water" style={styles.chip}>
                  {t('parks.hasWater')}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleRegisterVisit}
            style={styles.visitButton}
            contentStyle={styles.buttonContent}
          >
            {t('visits.registerTitle')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: width,
    height: 250,
  },
  infoCard: {
    margin: 16,
    elevation: 4,
  },
  parkName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  neighborhood: {
    color: '#666',
    marginBottom: 12,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    padding: 16,
  },
  visitButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})