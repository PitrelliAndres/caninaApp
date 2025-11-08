import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native'
import {
  Text,
  SegmentedButtons,
  FAB,
  Card,
  IconButton,
  useTheme,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import enUS from 'date-fns/locale/en-US'

import { visitService } from '../../services/api/visits'

export function MyVisitsScreen({ navigation }) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [viewType, setViewType] = useState('upcoming')
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false)
  const [visitToCancel, setVisitToCancel] = useState(null)

  const dateLocale = i18n.language === 'es' ? es : enUS

  useEffect(() => {
    loadVisits()
  }, [viewType])

  const loadVisits = async () => {
    try {
      setLoading(true)
      const response = await visitService.getMyVisits(viewType)
      setVisits(response.visits || [])
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadVisits()
  }

  const handleCancelVisit = async () => {
    if (!visitToCancel) return

    try {
      await visitService.cancelVisit(visitToCancel.id)
      Toast.show({
        type: 'success',
        text1: t('visits.visitCancelled'),
      })
      setCancelDialogVisible(false)
      setVisitToCancel(null)
      loadVisits()
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
    }
  }

  const openCancelDialog = (visit) => {
    setVisitToCancel(visit)
    setCancelDialogVisible(true)
  }

  const renderVisit = ({ item }) => (
    <Card style={styles.visitCard}>
      <Card.Content>
        <View style={styles.visitHeader}>
          <View style={styles.visitInfo}>
            <Text variant="titleMedium" style={styles.parkName}>
              {item.park_name}
            </Text>
            <Text variant="bodyLarge" style={styles.date}>
              {format(new Date(item.date), "EEEE, d 'de' MMMM", { locale: dateLocale })}
            </Text>
            <View style={styles.timeRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
              <Text style={styles.time}>{item.time}</Text>
              <Text style={styles.duration}>• {item.duration}</Text>
            </View>
            {item.notes && (
              <Text variant="bodySmall" style={styles.notes}>
                {item.notes}
              </Text>
            )}
          </View>

          {viewType === 'upcoming' && (
            <IconButton
              icon="delete"
              iconColor={theme.colors.error}
              onPress={() => openCancelDialog(item)}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  )

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="dog" size={64} color="#ccc" />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {t('visits.noUpcomingVisits')}
      </Text>
      <Text variant="bodyLarge" style={styles.emptyText}>
        {t('visits.registerFirstVisit')}
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('HomeTab')}
        style={styles.exploreButton}
      >
        {t('visits.exploreParks')}
      </Button>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">{t('visits.myVisits')}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {t('visits.subtitle')}
        </Text>

        <SegmentedButtons
          value={viewType}
          onValueChange={setViewType}
          buttons={[
            {
              value: 'upcoming',
              label: t('visits.tabs.upcoming'),
              icon: 'calendar-clock',
            },
            {
              value: 'past',
              label: t('visits.tabs.past'),
              icon: 'calendar-check',
            },
            {
              value: 'all',
              label: t('visits.tabs.all'),
              icon: 'calendar',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={visits}
        renderItem={renderVisit}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading && visits.length === 0 ? EmptyComponent : null}
      />

      <Portal>
        <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
          <Dialog.Title>{t('visits.cancelVisit')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('visits.cancelConfirm')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>
              {t('visits.keep')}
            </Button>
            <Button onPress={handleCancelVisit} textColor={theme.colors.error}>
              {t('visits.confirmCancel')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  visitCard: {
    marginBottom: 12,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  visitInfo: {
    flex: 1,
  },
  parkName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: '#666',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  exploreButton: {
    borderRadius: 8,
  },
})
