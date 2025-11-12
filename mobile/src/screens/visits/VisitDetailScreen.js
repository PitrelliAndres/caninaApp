import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Text, Card, Button, Chip, Avatar, useTheme } from 'react-native-paper'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

export function VisitDetailScreen({ route, navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)
  const { visit } = route.params || {}

  if (!visit) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.errorContainer}>
          <Text variant="headlineSmall">{t('visits.visitNotFound')}</Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={dynamicStyles.backButton}
          >
            {t('common.goBack')}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const handleJoinVisit = () => {
    // TODO: Implement join visit logic
    console.log('Joining visit:', visit.id)
  }

  const handleLeaveVisit = () => {
    // TODO: Implement leave visit logic
    console.log('Leaving visit:', visit.id)
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        {/* Park Information */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={dynamicStyles.parkName}>
              {visit.park?.name || t('visits.unknownPark')}
            </Text>
            <Text variant="bodyMedium" style={dynamicStyles.parkLocation}>
              {visit.park?.address || t('visits.noAddress')}
            </Text>
          </Card.Content>
        </Card>

        {/* Visit Information */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('visits.visitDetails')}
            </Text>

            <View style={dynamicStyles.detailRow}>
              <Text variant="bodyMedium" style={dynamicStyles.label}>
                {t('visits.scheduledTime')}:
              </Text>
              <Text variant="bodyMedium">
                {visit.scheduledTime ? new Date(visit.scheduledTime).toLocaleString() : t('visits.noTime')}
              </Text>
            </View>

            <View style={dynamicStyles.detailRow}>
              <Text variant="bodyMedium" style={dynamicStyles.label}>
                {t('visits.status')}:
              </Text>
              <Chip mode="outlined" style={dynamicStyles.statusChip}>
                {t(`visits.status.${visit.status}`) || visit.status}
              </Chip>
            </View>

            {visit.notes && (
              <View style={dynamicStyles.detailRow}>
                <Text variant="bodyMedium" style={dynamicStyles.label}>
                  {t('visits.notes')}:
                </Text>
                <Text variant="bodyMedium">{visit.notes}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Organizer Information */}
        {visit.organizer && (
          <Card style={dynamicStyles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
                {t('visits.organizer')}
              </Text>

              <View style={dynamicStyles.userRow}>
                <Avatar.Text
                  size={40}
                  label={visit.organizer.name?.charAt(0) || 'U'}
                />
                <View style={dynamicStyles.userInfo}>
                  <Text variant="bodyLarge">{visit.organizer.name || t('users.anonymous')}</Text>
                  {visit.organizer.dog && (
                    <Text variant="bodySmall" style={dynamicStyles.dogInfo}>
                      {t('users.withDog')}: {visit.organizer.dog.name}
                    </Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Participants */}
        {visit.participants && visit.participants.length > 0 && (
          <Card style={dynamicStyles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
                {t('visits.participants')} ({visit.participants.length})
              </Text>

              {visit.participants.map((participant, index) => (
                <View key={index} style={dynamicStyles.userRow}>
                  <Avatar.Text
                    size={32}
                    label={participant.name?.charAt(0) || 'U'}
                  />
                  <View style={dynamicStyles.userInfo}>
                    <Text variant="bodyMedium">{participant.name || t('users.anonymous')}</Text>
                    {participant.dog && (
                      <Text variant="bodySmall" style={dynamicStyles.dogInfo}>
                        {participant.dog.name}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={dynamicStyles.actionButtons}>
          {visit.status === 'scheduled' && (
            <>
              <Button
                mode="contained"
                onPress={handleJoinVisit}
                style={dynamicStyles.button}
              >
                {t('visits.joinVisit')}
              </Button>

              <Button
                mode="outlined"
                onPress={handleLeaveVisit}
                style={dynamicStyles.button}
              >
                {t('visits.leaveVisit')}
              </Button>
            </>
          )}

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={dynamicStyles.button}
          >
            {t('common.goBack')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  parkName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  parkLocation: {
    color: theme.colors.onSurfaceVariant,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.onSurface,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: '500',
    marginRight: 8,
    minWidth: 100,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dogInfo: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
})
