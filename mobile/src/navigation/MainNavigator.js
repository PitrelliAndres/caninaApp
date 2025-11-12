import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'react-native-paper'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { HomeNavigator } from './HomeNavigator'
import { ParksNavigator } from './ParksNavigator'
import { VisitsNavigator } from './VisitsNavigator'
import { DiscoverScreen } from '../screens/matches/DiscoverScreen'
import { MyMatchesScreen } from '../screens/matches/MyMatchesScreen'
import { ChatsNavigator } from './ChatsNavigator'
import { ProfileNavigator } from './ProfileNavigator'

const Tab = createBottomTabNavigator()

export function MainNavigator() {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarLabel: t('common.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ParksTab"
        component={ParksNavigator}
        options={{
          tabBarLabel: t('parks.title'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-multiple" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="VisitsTab"
        component={VisitsNavigator}
        options={{
          tabBarLabel: t('visits.myVisits'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{
          tabBarLabel: t('matches.tabs.discover'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cards-heart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MatchesTab"
        component={MyMatchesScreen}
        options={{
          tabBarLabel: t('matches.tabs.matches'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-multiple" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsNavigator}
        options={{
          tabBarLabel: t('chat.messages'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarLabel: t('profile.title'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
