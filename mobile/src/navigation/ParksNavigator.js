import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { ParksScreen } from '../screens/parks/ParksScreen';
import { ParkDetailScreen } from '../screens/parks/ParkDetailScreen';
import { RegisterVisitScreen } from '../screens/parks/RegisterVisitScreen';

const Stack = createNativeStackNavigator();

export function ParksNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ParksList"
        component={ParksScreen}
        options={{
          title: t('parks.title'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ParkDetail"
        component={ParkDetailScreen}
        options={{
          title: t('parks.parkDetails'),
        }}
      />
      <Stack.Screen
        name="RegisterVisit"
        component={RegisterVisitScreen}
        options={{
          title: t('visits.registerTitle'),
        }}
      />
    </Stack.Navigator>
  );
}
