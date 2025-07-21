import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'

import { ChatsListScreen } from '../screens/chats/ChatsListScreen'
import { ChatScreen } from '../screens/chats/ChatScreen'

const Stack = createNativeStackNavigator()

export function ChatsNavigator() {
  const { t } = useTranslation()

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ChatsList" 
        component={ChatsListScreen}
        options={{ 
          title: t('chat.messages'),
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={({ route }) => ({ 
          title: route.params?.user?.nickname || t('chat.messages')
        })}
      />
    </Stack.Navigator>
  )
}