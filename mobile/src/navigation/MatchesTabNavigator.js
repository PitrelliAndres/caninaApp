import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { DiscoverScreen } from '../screens/matches/DiscoverScreen'
import { MyMatchesScreen } from '../screens/matches/MyMatchesScreen'

const Tab = createBottomTabNavigator()

export function MatchesTabNavigator() {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: theme.colors.surface },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={{ 
          title: t('matches.tabs.discover'),
          tabBarIcon: ({ color }) => <Icon name="cards-heart" color={color} size={24} />
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MyMatchesScreen}
        options={{ 
          title: t('matches.tabs.matches'),
          tabBarIcon: ({ color }) => <Icon name="message-heart" color={color} size={24} />
        }}
      />
    </Tab.Navigator>
  )
}