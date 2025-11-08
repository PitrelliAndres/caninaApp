import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSelector } from 'react-redux'

import { AuthNavigator } from './AuthNavigator'
import { MainNavigator } from './MainNavigator'
import { OnboardingNavigator } from './OnboardingNavigator'

const Stack = createNativeStackNavigator()

export function AppNavigator() {
  const { isLoggedIn, user } = useSelector((state) => state.user)
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !user?.onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  )
}

