/**
 * ParkFilterModal Component
 * Pure React Native implementation
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  Surface,
  Text,
  Button,
  Switch,
  Divider,
  useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export function ParkFilterModal({ visible, onDismiss, filters, onApplyFilters }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      neighborhood: 'all',
      hasArea: false,
      isFenced: false,
      hasWater: false,
    };
    setLocalFilters(resetFilters);
  };

  const toggleFilter = (key) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Surface style={styles.surface} elevation={4}>
          <Text variant="headlineSmall" style={styles.title}>
            {t('parks.filters.title', 'Filtros')}
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <Text variant="bodyLarge">
                {t('parks.filters.hasArea', 'Área para perros')}
              </Text>
              <Switch
                value={localFilters.hasArea}
                onValueChange={() => toggleFilter('hasArea')}
              />
            </View>

            <View style={styles.filterRow}>
              <Text variant="bodyLarge">
                {t('parks.filters.isFenced', 'Cercado')}
              </Text>
              <Switch
                value={localFilters.isFenced}
                onValueChange={() => toggleFilter('isFenced')}
              />
            </View>

            <View style={styles.filterRow}>
              <Text variant="bodyLarge">
                {t('parks.filters.hasWater', 'Fuente de agua')}
              </Text>
              <Switch
                value={localFilters.hasWater}
                onValueChange={() => toggleFilter('hasWater')}
              />
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={styles.button}
            >
              {t('common.reset', 'Limpiar')}
            </Button>

            <Button
              mode="contained"
              onPress={handleApply}
              style={styles.button}
            >
              {t('common.apply', 'Aplicar')}
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
  },
  surface: {
    padding: 20,
    borderRadius: 12,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
