import React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { useTranslation } from 'react-i18next'

import { DiscoverScreen } from '../screens/matches/DiscoverScreen'
import { MyMatchesScreen } from '../screens/matches/MyMatchesScreen'

const Tab = createMaterialTopTabNavigator()

export function MatchesTabNavigator() {
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarIndicatorStyle: { backgroundColor: '#2563eb' },
        tabBarStyle: { backgroundColor: '#fff' },
      }}
    >
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={{ title: t('matches.tabs.discover') }}
      />
      <Tab.Screen 
        name="MyMatches" 
        component={MyMatchesScreen}
        options={{ title: t('matches.tabs.myMatches') }}
      />
    </Tab.Navigator>
  )
}