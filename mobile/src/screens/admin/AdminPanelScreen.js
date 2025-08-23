import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  List,
  Badge,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

export function AdminPanelScreen({ navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalParks: 0,
    totalVisits: 0,
    totalMatches: 0,
    pendingReports: 0,
    activeUsers: 0,
  })
  const [loading, setLoading] = useState(false)

  // Mock admin data - replace with real API calls
  const mockStats = {
    totalUsers: 1250,
    totalParks: 45,
    totalVisits: 3420,
    totalMatches: 890,
    pendingReports: 3,
    activeUsers: 150,
  }

  useEffect(() => {
    loadAdminStats()
  }, [])

  const loadAdminStats = async () => {
    setLoading(true)
    try {
      // TODO: Replace with real API call
      setTimeout(() => {
        setStats(mockStats)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading admin stats:', error)
      setLoading(false)
    }
  }

  const handleUserManagement = () => {
    // TODO: Navigate to user management screen
    Alert.alert(t('admin.userManagement'), t('admin.featureComingSoon'))
  }

  const handleParkManagement = () => {
    // TODO: Navigate to park management screen
    Alert.alert(t('admin.parkManagement'), t('admin.featureComingSoon'))
  }

  const handleReportManagement = () => {
    // TODO: Navigate to report management screen
    Alert.alert(t('admin.reportManagement'), t('admin.featureComingSoon'))
  }

  const handleAnalytics = () => {
    // TODO: Navigate to analytics screen
    Alert.alert(t('admin.analytics'), t('admin.featureComingSoon'))
  }

  const handleSystemSettings = () => {
    // TODO: Navigate to system settings screen
    Alert.alert(t('admin.systemSettings'), t('admin.featureComingSoon'))
  }

  const handleBackup = () => {
    Alert.alert(
      t('admin.backup'),
      t('admin.backupConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('admin.startBackup'),
          onPress: async () => {
            try {
              // TODO: Implement backup functionality
              Alert.alert(t('common.success'), t('admin.backupStarted'))
            } catch (error) {
              Alert.alert(t('common.error'), t('admin.backupError'))
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('admin.systemOverview')}
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.totalUsers}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {t('admin.totalUsers')}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.activeUsers}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {t('admin.activeUsers')}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.totalParks}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {t('admin.totalParks')}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.totalVisits}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {t('admin.totalVisits')}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.totalMatches}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {t('admin.totalMatches')}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statWithBadge}>
                  <Text variant="headlineSmall" style={[styles.statNumber, { color: theme.colors.error }]}>
                    {stats.pendingReports}
                  </Text>
                  {stats.pendingReports > 0 && (
                    <Badge style={styles.badge}>{stats.pendingReports}</Badge>
                  )}
                </View>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {t('admin.pendingReports')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Management Options */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('admin.management')}
            </Text>
            
            <List.Item
              title={t('admin.userManagement')}
              description={t('admin.userManagementDescription')}
              left={props => <List.Icon {...props} icon="account-group" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleUserManagement}
            />
            
            <List.Item
              title={t('admin.parkManagement')}
              description={t('admin.parkManagementDescription')}
              left={props => <List.Icon {...props} icon="tree" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleParkManagement}
            />
            
            <List.Item
              title={t('admin.reportManagement')}
              description={t('admin.reportManagementDescription')}
              left={props => <List.Icon {...props} icon="flag" />}
              right={() => (
                <View style={styles.listItemRight}>
                  {stats.pendingReports > 0 && (
                    <Badge style={styles.badge}>{stats.pendingReports}</Badge>
                  )}
                  <List.Icon icon="chevron-right" />
                </View>
              )}
              onPress={handleReportManagement}
            />
          </Card.Content>
        </Card>

        {/* System Options */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('admin.system')}
            </Text>
            
            <List.Item
              title={t('admin.analytics')}
              description={t('admin.analyticsDescription')}
              left={props => <List.Icon {...props} icon="chart-line" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleAnalytics}
            />
            
            <List.Item
              title={t('admin.systemSettings')}
              description={t('admin.systemSettingsDescription')}
              left={props => <List.Icon {...props} icon="cog" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleSystemSettings}
            />
            
            <List.Item
              title={t('admin.backup')}
              description={t('admin.backupDescription')}
              left={props => <List.Icon {...props} icon="database" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleBackup}
            />
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={loadAdminStats}
            loading={loading}
            style={styles.actionButton}
            icon="refresh"
          >
            {t('admin.refreshStats')}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
            icon="arrow-left"
          >
            {t('common.back')}
          </Button>
        </View>

        <View style={styles.warningContainer}>
          <Text variant="bodySmall" style={styles.warningText}>
            {t('admin.adminWarning')}
          </Text>
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
  statsCard: {
    margin: 16,
    elevation: 2,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  badge: {
    marginLeft: 8,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  warningContainer: {
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    color: '#dc2626',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})