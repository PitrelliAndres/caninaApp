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
  const dynamicStyles = styles(theme);

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
          dynamicStyles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Surface style={dynamicStyles.surface} elevation={4}>
          <Text variant="headlineSmall" style={dynamicStyles.title}>
            {t('parks.filters.title', 'Filtros')}
          </Text>

          <Divider style={dynamicStyles.divider} />

          <View style={dynamicStyles.filterSection}>
            <View style={dynamicStyles.filterRow}>
              <Text variant="bodyLarge">
                {t('parks.filters.hasArea', 'Área para perros')}
              </Text>
              <Switch
                value={localFilters.hasArea}
                onValueChange={() => toggleFilter('hasArea')}
              />
            </View>

            <View style={dynamicStyles.filterRow}>
              <Text variant="bodyLarge">
                {t('parks.filters.isFenced', 'Cercado')}
              </Text>
              <Switch
                value={localFilters.isFenced}
                onValueChange={() => toggleFilter('isFenced')}
              />
            </View>

            <View style={dynamicStyles.filterRow}>
              <Text variant="bodyLarge">
                {t('parks.filters.hasWater', 'Fuente de agua')}
              </Text>
              <Switch
                value={localFilters.hasWater}
                onValueChange={() => toggleFilter('hasWater')}
              />
            </View>
          </View>

          <Divider style={dynamicStyles.divider} />

          <View style={dynamicStyles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={dynamicStyles.button}
            >
              {t('common.reset', 'Limpiar')}
            </Button>

            <Button
              mode="contained"
              onPress={handleApply}
              style={dynamicStyles.button}
            >
              {t('common.apply', 'Aplicar')}
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = (theme) => StyleSheet.create({
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
