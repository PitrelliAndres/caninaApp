import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'

import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { EditProfileScreen } from '../screens/profile/EditProfileScreen'
import { PrivacySettingsScreen } from '../screens/profile/PrivacySettingsScreen'
import { AdminPanelScreen } from '../screens/admin/AdminPanelScreen'

const Stack = createNativeStackNavigator()

export function ProfileNavigator() {
  const { t } = useTranslation()

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: t('profile.title'),
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: t('profile.editProfile')
        }}
      />
      <Stack.Screen 
        name="PrivacySettings" 
        component={PrivacySettingsScreen}
        options={{ 
          title: t('profile.privacySettings')
        }}
      />
      <Stack.Screen 
        name="AdminPanel" 
        component={AdminPanelScreen}
        options={{ 
          title: t('admin.title')
        }}
      />
    </Stack.Navigator>
  )
}