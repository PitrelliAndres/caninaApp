import React, { useState } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { Card, Button, Chip, ActivityIndicator } from 'react-native-paper'
import { useSelector, useDispatch } from 'react-redux'

// Nuevos hooks de TanStack Query
import { 
  useParks, 
  useFavoritePark,
  useDiscoverUsers,
  useLikeUser,
  useConversations,
  useSendMessage,
  useAuthState
} from '../../lib/api/hooks'

// Redux selectors y actions
import { 
  selectSearchFilters, 
  updateSearchFilters,
  selectOnboardingStep,
  setOnboardingStep,
  selectModal,
  setModal
} from '../../store/slices/uiSlice'

import { 
  selectConversations,
  selectCurrentChat 
} from '../../store/slices/chatSlice'

/**
 * Componente de ejemplo que muestra cómo usar la nueva arquitectura:
 * - TanStack Query para HTTP requests
 * - Redux para UI state 
 * - Socket.IO integrado automáticamente
 */
export default function ArchitectureExample() {
  const dispatch = useDispatch()
  
  // === Redux State ===
  const searchFilters = useSelector(selectSearchFilters)
  const onboardingStep = useSelector(selectOnboardingStep)
  const parkModalVisible = useSelector(selectModal)('parkFilter')
  const conversations = useSelector(selectConversations)
  const currentChat = useSelector(selectCurrentChat)
  
  // === Auth State (TanStack Query) ===
  const { isAuthenticated, user, isLoading: authLoading } = useAuthState()
  
  // === Parks Data (TanStack Query) ===
  const { 
    data: parks, 
    isLoading: parksLoading, 
    error: parksError,
    refetch: refetchParks 
  } = useParks(searchFilters)
  
  // === Matches Data (TanStack Query) ===
  const { 
    users: discoverUsers, 
    isLoading: discoverLoading,
    fetchNextPage,
    hasNextPage 
  } = useDiscoverUsers(searchFilters)
  
  // === Messages Data (TanStack Query) ===
  const { 
    data: conversationsList, 
    isLoading: conversationsLoading 
  } = useConversations()
  
  // === Mutations (TanStack Query) ===
  const favoritePark = useFavoritePark()
  const likeUser = useLikeUser()
  const sendMessage = useSendMessage()
  
  // === Local State ===
  const [selectedParkId, setSelectedParkId] = useState(null)
  const [messageText, setMessageText] = useState('')

  // === Handlers ===
  const handleFilterChange = () => {
    // Redux action para cambiar filtros de búsqueda
    dispatch(updateSearchFilters({
      radius: searchFilters.radius === 5 ? 10 : 5,
      ageRange: [2, 10]
    }))
  }

  const handleOnboardingNext = () => {
    // Redux action para UI state
    dispatch(setOnboardingStep(onboardingStep + 1))
  }

  const handleToggleModal = () => {
    // Redux action para modals
    dispatch(setModal({ modal: 'parkFilter', visible: !parkModalVisible }))
  }

  const handleFavoritePark = (parkId) => {
    // TanStack Query mutation
    favoritePark.mutate({ 
      parkId, 
      isFavorite: true 
    }, {
      onSuccess: () => {
        Alert.alert('Éxito', 'Parque agregado a favoritos')
      },
      onError: (error) => {
        Alert.alert('Error', error.message)
      }
    })
  }

  const handleLikeUser = (userId) => {
    // TanStack Query mutation
    likeUser.mutate(userId, {
      onSuccess: (data) => {
        if (data.is_mutual) {
          Alert.alert('¡Match!', '¡Tienes un nuevo match!')
        } else {
          Alert.alert('Like enviado', 'Like enviado correctamente')
        }
      }
    })
  }

  const handleSendMessage = () => {
    if (!currentChat || !messageText.trim()) return
    
    // TanStack Query mutation + Socket.IO automático
    sendMessage.mutate({
      conversationId: currentChat.chat_id,
      text: messageText.trim()
    }, {
      onSuccess: () => {
        setMessageText('')
        Alert.alert('Mensaje enviado')
      }
    })
  }

  // === Loading States ===
  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Cargando autenticación...</Text>
      </View>
    )
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Necesitas iniciar sesión</Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Ejemplo de Nueva Arquitectura
      </Text>
      
      {/* === Redux UI State === */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Redux UI State" />
        <Card.Content>
          <Text>Onboarding Step: {onboardingStep}</Text>
          <Text>Modal Visible: {parkModalVisible ? 'Sí' : 'No'}</Text>
          <Text>Radio de búsqueda: {searchFilters.radius} km</Text>
          
          <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
            <Button mode="outlined" onPress={handleOnboardingNext}>
              Siguiente Onboarding
            </Button>
            <Button mode="outlined" onPress={handleToggleModal}>
              Toggle Modal
            </Button>
            <Button mode="outlined" onPress={handleFilterChange}>
              Cambiar Filtros
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* === TanStack Query Data === */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="TanStack Query - Parks" />
        <Card.Content>
          {parksLoading ? (
            <ActivityIndicator />
          ) : parksError ? (
            <Text style={{ color: 'red' }}>Error: {parksError.message}</Text>
          ) : (
            <>
              <Text>Parques encontrados: {parks?.length || 0}</Text>
              {parks?.slice(0, 3).map(park => (
                <View key={park.id} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginVertical: 4 
                }}>
                  <Text>{park.name}</Text>
                  <Button 
                    mode="outlined" 
                    onPress={() => handleFavoritePark(park.id)}
                    loading={favoritePark.isPending}
                  >
                    ❤️
                  </Button>
                </View>
              ))}
              <Button mode="outlined" onPress={refetchParks} style={{ marginTop: 8 }}>
                Refrescar Parques
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* === Discover Users === */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="TanStack Query - Discover" />
        <Card.Content>
          {discoverLoading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text>Usuarios para match: {discoverUsers?.length || 0}</Text>
              {discoverUsers?.slice(0, 2).map(user => (
                <View key={user.id} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginVertical: 4 
                }}>
                  <Text>{user.name}</Text>
                  <Button 
                    mode="outlined" 
                    onPress={() => handleLikeUser(user.id)}
                    loading={likeUser.isPending}
                  >
                    👍
                  </Button>
                </View>
              ))}
              {hasNextPage && (
                <Button mode="outlined" onPress={fetchNextPage} style={{ marginTop: 8 }}>
                  Cargar Más Usuarios
                </Button>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* === Messages (Socket.IO + HTTP) === */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Messages - Socket.IO + HTTP" />
        <Card.Content>
          {conversationsLoading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text>Conversaciones: {conversations?.length || 0}</Text>
              <Text>Chat actual: {currentChat?.user?.name || 'Ninguno'}</Text>
              
              {currentChat && (
                <View style={{ marginTop: 8 }}>
                  <Text>Enviar mensaje:</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4, gap: 8 }}>
                    <Button 
                      mode="outlined" 
                      onPress={() => setMessageText('¡Hola!')}
                    >
                      "¡Hola!"
                    </Button>
                    <Button 
                      mode="outlined" 
                      onPress={handleSendMessage}
                      loading={sendMessage.isPending}
                    >
                      Enviar
                    </Button>
                  </View>
                </View>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* === Estado de Usuario === */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Usuario Actual" />
        <Card.Content>
          <Text>ID: {user?.id}</Text>
          <Text>Nombre: {user?.name}</Text>
          <Text>Email: {user?.email}</Text>
          
          <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 4 }}>
            <Chip>Autenticado</Chip>
            {user?.onboarding_completed && <Chip>Onboarding Completo</Chip>}
            {user?.verified && <Chip>Verificado</Chip>}
          </View>
        </Card.Content>
      </Card>

      <Text style={{ 
        fontSize: 12, 
        color: 'gray', 
        textAlign: 'center',
        marginTop: 16 
      }}>
        Este componente demuestra la integración de TanStack Query (HTTP), 
        Redux (UI state) y Socket.IO (real-time) trabajando juntos.
      </Text>
    </ScrollView>
  )
}
