/**
 * ParkCard Component
 * Pure React Native implementation
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

export function ParkCard({ park, onPress, onRegisterVisit }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const dynamicStyles = styles(theme);

  return (
    <Card style={dynamicStyles.card} onPress={onPress}>
      <Card.Cover
        source={{
          uri: park.photo_url || 'https://via.placeholder.com/400x200',
        }}
      />

      <Card.Content style={dynamicStyles.content}>
        <Text variant="titleLarge" style={dynamicStyles.title}>
          {park.name}
        </Text>

        <View style={dynamicStyles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={dynamicStyles.neighborhood}>
            {park.neighborhood}
          </Text>
        </View>

        <Text
          variant="bodyMedium"
          style={dynamicStyles.description}
          numberOfLines={2}
        >
          {park.description}
        </Text>

        <View style={dynamicStyles.features}>
          {park.has_dog_area && (
            <Chip icon="dog" style={dynamicStyles.chip}>
              {t('parks.dogArea')}
            </Chip>
          )}
          {park.is_fenced && (
            <Chip icon="fence" style={dynamicStyles.chip}>
              {t('parks.fenced')}
            </Chip>
          )}
          {park.has_water && (
            <Chip icon="water" style={dynamicStyles.chip}>
              {t('parks.waterAvailable')}
            </Chip>
          )}
        </View>

        {park.active_visits_today > 0 && (
          <View style={dynamicStyles.visitorsRow}>
            <MaterialCommunityIcons
              name="account-multiple"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodySmall" style={dynamicStyles.visitorsText}>
              {t('parks.visitorsToday', { count: park.active_visits_today })}
            </Text>
          </View>
        )}
      </Card.Content>

      <Card.Actions>
        <Button
          mode="contained"
          onPress={(e) => {
            e.stopPropagation();
            onRegisterVisit();
          }}
          icon="calendar-plus"
        >
          {t('parks.registerVisit')}
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = (theme) => StyleSheet.create({
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
    color: theme.colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  visitorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  visitorsText: {
    marginLeft: 4,
    color: theme.colors.onSurfaceVariant,
  },
});
