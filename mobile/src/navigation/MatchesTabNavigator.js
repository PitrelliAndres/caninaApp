import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTranslation } from 'react-i18next'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { DiscoverScreen } from '../screens/matches/DiscoverScreen'
import { MyMatchesScreen } from '../screens/matches/MyMatchesScreen'

const Tab = createBottomTabNavigator()

export function MatchesTabNavigator() {
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { backgroundColor: '#fff' },
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