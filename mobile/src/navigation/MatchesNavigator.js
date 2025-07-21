import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'

import { MatchesTabNavigator } from './MatchesTabNavigator'
import { UserProfileScreen } from '../screens/matches/UserProfileScreen'

const Stack = createNativeStackNavigator()

export function MatchesNavigator() {
  const { t } = useTranslation()

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MatchesTabs" 
        component={MatchesTabNavigator}
        options={{ 
          title: t('matches.title'),
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ 
          title: t('profile.title')
        }}
      />
    </Stack.Navigator>
  )
}