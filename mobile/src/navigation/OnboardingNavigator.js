import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Step1Screen } from '../screens/onboarding/Step1Screen'
import { Step2Screen } from '../screens/onboarding/Step2Screen'
import { Step3Screen } from '../screens/onboarding/Step3Screen'

const Stack = createNativeStackNavigator()

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Step1" component={Step1Screen} />
      <Stack.Screen name="Step2" component={Step2Screen} />
      <Stack.Screen name="Step3" component={Step3Screen} />
    </Stack.Navigator>
  )
}

