import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Step1Screen } from '../screens/onboarding/Step1Screen'
import { Step2Screen } from '../screens/onboarding/Step2Screen'
import { Step3Screen } from '../screens/onboarding/Step3Screen'
import { Step4Screen } from '../screens/onboarding/Step4Screen'
import { Step5Screen } from '../screens/onboarding/Step5Screen'
import { Step6Screen } from '../screens/onboarding/Step6Screen'
import { Step7Screen } from '../screens/onboarding/Step7Screen'
import { Step8Screen } from '../screens/onboarding/Step8Screen'
import { Step9Screen } from '../screens/onboarding/Step9Screen'
import { Step10Screen } from '../screens/onboarding/Step10Screen'

const Stack = createNativeStackNavigator()

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Step1" component={Step1Screen} />
      <Stack.Screen name="Step2" component={Step2Screen} />
      <Stack.Screen name="Step3" component={Step3Screen} />
      <Stack.Screen name="Step4" component={Step4Screen} />
      <Stack.Screen name="Step5" component={Step5Screen} />
      <Stack.Screen name="Step6" component={Step6Screen} />
      <Stack.Screen name="Step7" component={Step7Screen} />
      <Stack.Screen name="Step8" component={Step8Screen} />
      <Stack.Screen name="Step9" component={Step9Screen} />
      <Stack.Screen name="Step10" component={Step10Screen} />
    </Stack.Navigator>
  )
}

