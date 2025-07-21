import React from 'react'
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { Card, Text, Button, Chip } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'

export function ParkCard({ park, onPress, onRegisterVisit }) {
  const { t } = useTranslation()

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Cover source={{ uri: park.photo_url || 'https://via.placeholder.com/400x200' }} />
      
      <Card.Content style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          {park.name}
        </Text>
        
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
          <Text variant="bodyMedium" style={styles.neighborhood}>
            {park.neighborhood}
          </Text>
        </View>
        
        <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
          {park.description}
        </Text>
        
        <View style={styles.features}>
          {park.has_dog_area && (
            <Chip icon="dog" style={styles.chip}>
              {t('parks.dogArea')}
            </Chip>
          )}
          {park.is_fenced && (
            <Chip icon="fence" style={styles.chip}>
              {t('parks.fenced')}
            </Chip>
          )}
          {park.has_water && (
            <Chip icon="water" style={styles.chip}>
              {t('parks.waterAvailable')}
            </Chip>
          )}
        </View>
        
        {park.active_visits_today > 0 && (
          <View style={styles.visitorsRow}>
            <MaterialCommunityIcons name="account-multiple" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.visitorsText}>
              {t('parks.visitorsToday', { count: park.active_visits_today })}
            </Text>
          </View>
        )}
      </Card.Content>
      
      <Card.Actions>
        <Button
          mode="contained"
          onPress={(e) => {
            e.stopPropagation()
            onRegisterVisit()
          }}
          icon="calendar-plus"
        >
          {t('parks.registerVisit')}
        </Button>
      </Card.Actions>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  content: {
    paddingTop: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  neighborhood: {
    marginLeft: 4,
    color: '#666',
    textTransform: 'capitalize',
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#e3f2fd',
  },
  visitorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  visitorsText: {
    marginLeft: 4,
    color: '#666',
  },
})