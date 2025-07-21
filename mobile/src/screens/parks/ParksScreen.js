// mobile/src/screens/parks/ParksScreen.js
import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native'
import {
  Searchbar,
  SegmentedButtons,
  FAB,
  Portal,
  useTheme,
} from 'react-native-paper'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import * as Location from 'expo-location'
import Toast from 'react-native-toast-message'

import { ParkCard } from '../../components/parks/ParkCard'
import { ParkFilterModal } from '../../components/parks/ParkFilterModal'
import { useParks } from '../../hooks/useParks'
import { useLocation } from '../../hooks/useLocation'

const { width, height } = Dimensions.get('window')

export function ParksScreen({ navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const mapRef = useRef(null)
  
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    neighborhood: 'all',
    hasArea: false,
    isFenced: false,
    hasWater: false,
  })
  const [showFilters, setShowFilters] = useState(false)
  
  const { parks, loading, error, refetch } = useParks({ ...filters, search: searchQuery })
  const { location, requestPermission } = useLocation()

  useEffect(() => {
    requestPermission()
  }, [])

  const handleParkPress = (park) => {
    navigation.navigate('ParkDetail', { park })
  }

  const handleMapReady = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      })
    }
  }

  const renderParkCard = ({ item }) => (
    <ParkCard
      park={item}
      onPress={() => handleParkPress(item)}
      onRegisterVisit={() => navigation.navigate('RegisterVisit', { park: item })}
    />
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder={t('parks.searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            {
              value: 'list',
              label: t('parks.listView'),
              icon: 'view-list',
            },
            {
              value: 'map',
              label: t('parks.mapView'),
              icon: 'map',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={parks}
          renderItem={renderParkCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t('parks.noParksFound')}
              </Text>
            </View>
          }
        />
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton
          onMapReady={handleMapReady}
          initialRegion={{
            latitude: -34.6037,
            longitude: -58.3816,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {parks.map((park) => (
            <Marker
              key={park.id}
              coordinate={{
                latitude: park.latitude,
                longitude: park.longitude,
              }}
              title={park.name}
              description={park.neighborhood}
              onCalloutPress={() => handleParkPress(park)}
            />
          ))}
        </MapView>
      )}

      <Portal>
        <FAB
          icon="filter"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowFilters(true)}
        />
      </Portal>

      <ParkFilterModal
        visible={showFilters}
        onDismiss={() => setShowFilters(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters)
          setShowFilters(false)
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchbar: {
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
})