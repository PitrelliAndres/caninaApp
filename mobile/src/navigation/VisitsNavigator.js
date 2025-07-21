import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'

import { MyVisitsScreen } from '../screens/visits/MyVisitsScreen'
import { VisitDetailScreen } from '../screens/visits/VisitDetailScreen'

const Stack = createNativeStackNavigator()

export function VisitsNavigator() {
  const { t } = useTranslation()

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MyVisits" 
        component={MyVisitsScreen}
        options={{ 
          title: t('visits.myVisits'),
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="VisitDetail" 
        component={VisitDetailScreen}
        options={{ 
          title: t('visits.myVisits')
        }}
      />
    </Stack.Navigator>
  )
}