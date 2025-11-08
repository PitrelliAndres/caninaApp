import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'

import { ParksScreen } from '../screens/parks/ParksScreen'
import { ParkDetailScreen } from '../screens/parks/ParkDetailScreen'
import { RegisterVisitScreen } from '../screens/parks/RegisterVisitScreen'

const Stack = createNativeStackNavigator()

export function HomeNavigator() {
  const { t } = useTranslation()

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Parks"
        component={ParksScreen}
        options={{
          title: t('parks.title'),
          headerShown: false
        }}
      />
      <Stack.Screen
        name="ParkDetail"
        component={ParkDetailScreen}
        options={({ route }) => ({
          title: route.params?.park?.name || t('parks.title')
        })}
      />
      <Stack.Screen
        name="RegisterVisit"
        component={RegisterVisitScreen}
        options={{
          title: t('visits.registerTitle', { parkName: '' }),
          presentation: 'modal'
        }}
      />
    </Stack.Navigator>
  )
}
