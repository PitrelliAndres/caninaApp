import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Text, Card, Button, Chip, Avatar } from 'react-native-paper'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

export function VisitDetailScreen({ route, navigation }) {
  const { t } = useTranslation()
  const { visit } = route.params || {}

  if (!visit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall">{t('visits.visitNotFound')}</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Park Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.parkName}>
              {visit.park?.name || t('visits.unknownPark')}
            </Text>
            <Text variant="bodyMedium" style={styles.parkLocation}>
              {visit.park?.address || t('visits.noAddress')}
            </Text>
          </Card.Content>
        </Card>

        {/* Visit Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('visits.visitDetails')}
            </Text>
            
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('visits.scheduledTime')}:
              </Text>
              <Text variant="bodyMedium">
                {visit.scheduledTime ? new Date(visit.scheduledTime).toLocaleString() : t('visits.noTime')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('visits.status')}:
              </Text>
              <Chip mode="outlined" style={styles.statusChip}>
                {t(`visits.status.${visit.status}`) || visit.status}
              </Chip>
            </View>

            {visit.notes && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  {t('visits.notes')}:
                </Text>
                <Text variant="bodyMedium">{visit.notes}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Organizer Information */}
        {visit.organizer && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('visits.organizer')}
              </Text>
              
              <View style={styles.userRow}>
                <Avatar.Text 
                  size={40} 
                  label={visit.organizer.name?.charAt(0) || 'U'} 
                />
                <View style={styles.userInfo}>
                  <Text variant="bodyLarge">{visit.organizer.name || t('users.anonymous')}</Text>
                  {visit.organizer.dog && (
                    <Text variant="bodySmall" style={styles.dogInfo}>
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
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('visits.participants')} ({visit.participants.length})
              </Text>
              
              {visit.participants.map((participant, index) => (
                <View key={index} style={styles.userRow}>
                  <Avatar.Text 
                    size={32} 
                    label={participant.name?.charAt(0) || 'U'} 
                  />
                  <View style={styles.userInfo}>
                    <Text variant="bodyMedium">{participant.name || t('users.anonymous')}</Text>
                    {participant.dog && (
                      <Text variant="bodySmall" style={styles.dogInfo}>
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
        <View style={styles.actionButtons}>
          {visit.status === 'scheduled' && (
            <>
              <Button 
                mode="contained" 
                onPress={handleJoinVisit}
                style={styles.button}
              >
                {t('visits.joinVisit')}
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={handleLeaveVisit}
                style={styles.button}
              >
                {t('visits.leaveVisit')}
              </Button>
            </>
          )}
          
          <Button 
            mode="text" 
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            {t('common.goBack')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#666',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
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
    color: '#666',
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