/**
 * ParkDetailScreen
 * Pure React Native implementation with react-native-maps
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  useTheme,
} from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export function ParkDetailScreen({ route, navigation }) {
  const { park } = route.params;
  const { t } = useTranslation();
  const theme = useTheme();
  const dynamicStyles = styles(theme);

  const handleRegisterVisit = () => {
    navigation.navigate('RegisterVisit', { park });
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MapView
          style={dynamicStyles.map}
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

        <Card style={dynamicStyles.infoCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={dynamicStyles.parkName}>
              {park.name}
            </Text>

            <Text variant="bodyMedium" style={dynamicStyles.neighborhood}>
              {park.neighborhood}
            </Text>

            {park.description && (
              <Text variant="bodyMedium" style={dynamicStyles.description}>
                {park.description}
              </Text>
            )}

            <View style={dynamicStyles.featuresContainer}>
              {park.hasArea && (
                <Chip icon="run" style={dynamicStyles.chip}>
                  {t('parks.hasArea')}
                </Chip>
              )}
              {park.isFenced && (
                <Chip icon="fence" style={dynamicStyles.chip}>
                  {t('parks.isFenced')}
                </Chip>
              )}
              {park.hasWater && (
                <Chip icon="water" style={dynamicStyles.chip}>
                  {t('parks.hasWater')}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        <View style={dynamicStyles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleRegisterVisit}
            style={dynamicStyles.visitButton}
            contentStyle={dynamicStyles.buttonContent}
          >
            {t('visits.registerTitle')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.onSurfaceVariant,
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
});
