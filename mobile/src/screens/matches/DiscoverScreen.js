// ParkDogNew/src/screens/matches/DiscoverScreen.js
import React, { useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  Chip,
  useTheme,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'

// import { useMatches } from '../../hooks/useMatches'
// import { matchService } from '../../services/api/matches'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
const SWIPE_THRESHOLD = 0.25 * screenWidth
const SWIPE_OUT_DURATION = 250

// Datos dummy para sugerencias de matches
const DUMMY_SUGGESTIONS = [
  {
    id: 1,
    user_id: 101,
    nickname: 'María',
    user: { age: 28, avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b147' },
    dog: { name: 'Luna', breed: 'Golden Retriever', age: 3 },
    compatibility: 85,
    park_name: 'Parque Centenario',
    shared_interests: ['Paseos matutinos', 'Entrenamiento', 'Juegos']
  },
  {
    id: 2,
    user_id: 102,
    nickname: 'Carlos',
    user: { age: 32, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' },
    dog: { name: 'Max', breed: 'Labrador', age: 2 },
    compatibility: 78,
    park_name: 'Parque Sarmiento',
    shared_interests: ['Deportes caninos', 'Socialización']
  },
  {
    id: 3,
    user_id: 103,
    nickname: 'Ana',
    user: { age: 25, avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80' },
    dog: { name: 'Coco', breed: 'Border Collie', age: 4 },
    compatibility: 92,
    park_name: 'Parque Rivadavia',
    shared_interests: ['Agilidad', 'Paseos largos', 'Fotografía']
  },
  {
    id: 4,
    user_id: 104,
    nickname: 'Diego',
    user: { age: 29, avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e' },
    dog: { name: 'Rocky', breed: 'Pastor Alemán', age: 5 },
    compatibility: 73,
    park_name: 'Parque Chacabuco',
    shared_interests: ['Entrenamiento', 'Guardería']
  }
]

export function DiscoverScreen({ navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)
  const [suggestions] = useState(DUMMY_SUGGESTIONS)
  const [loading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const position = useRef(new Animated.ValueXY()).current
  const currentSuggestion = suggestions[currentIndex]

  const rotate = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  })

  const rotateAndTranslate = {
    transform: [
      {
        rotate: rotate,
      },
      ...position.getTranslateTransform(),
    ],
  }

  const likeOpacity = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  })

  const nopeOpacity = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  })

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [1, 0, 1],
    extrapolate: 'clamp',
  })

  const nextCardScale = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [1, 0.8, 1],
    extrapolate: 'clamp',
  })

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy })
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe('right')
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left')
        } else {
          resetPosition()
        }
      },
    })
  ).current

  const forceSwipe = (direction) => {
    const x = direction === 'right' ? screenWidth : -screenWidth
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction))
  }

  const onSwipeComplete = async (direction) => {
    const action = direction === 'right' ? 'like' : 'pass'

    // Simular match con 30% de probabilidad en likes
    if (action === 'like' && Math.random() < 0.3) {
      Toast.show({
        type: 'success',
        text1: t('matches.itsAMatch'),
        text2: t('matches.mutualLike'),
      })
    } else if (action === 'like') {
      Toast.show({
        type: 'info',
        text1: t('matches.likeSent'),
        text2: t('matches.waitingForResponse'),
      })
    }

    position.setValue({ x: 0, y: 0 })
    setCurrentIndex(currentIndex + 1)
  }

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false,
    }).start()
  }

  if (loading || !currentSuggestion) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.centerContainer}>
          <Text variant="bodyLarge">{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (currentIndex >= suggestions.length) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.centerContainer}>
          <Text variant="headlineSmall" style={dynamicStyles.noMoreText}>
            {t('matches.noMoreSuggestions')}
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              setCurrentIndex(0)
              // Reiniciar con datos dummy
            }}
            style={dynamicStyles.refreshButton}
          >
            {t('common.refresh')}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text variant="headlineMedium">{t('matches.tabs.discover')}</Text>
      </View>

      <View style={dynamicStyles.cardContainer}>
        {suggestions[currentIndex + 1] && (
          <Animated.View
            style={[
              dynamicStyles.cardStyle,
              {
                opacity: nextCardOpacity,
                transform: [{ scale: nextCardScale }],
              },
            ]}
          >
            <MatchCard profile={suggestions[currentIndex + 1]} />
          </Animated.View>
        )}

        <Animated.View
          {...panResponder.panHandlers}
          style={[rotateAndTranslate, dynamicStyles.cardStyle]}
        >
          <Animated.View
            style={[
              dynamicStyles.likeLabel,
              {
                opacity: likeOpacity,
              },
            ]}
          >
            <Text style={dynamicStyles.likeText}>{t('matches.likeButton')}</Text>
          </Animated.View>

          <Animated.View
            style={[
              dynamicStyles.nopeLabel,
              {
                opacity: nopeOpacity,
              },
            ]}
          >
            <Text style={dynamicStyles.nopeText}>{t('matches.nopeButton')}</Text>
          </Animated.View>

          <MatchCard profile={currentSuggestion} />
        </Animated.View>
      </View>

      <View style={dynamicStyles.buttonsContainer}>
        <Button
          mode="contained-tonal"
          onPress={() => forceSwipe('left')}
          style={[dynamicStyles.button, dynamicStyles.passButton]}
          contentStyle={dynamicStyles.buttonContent}
          icon="close"
        >
          {t('matches.pass')}
        </Button>

        <Button
          mode="contained"
          onPress={() => forceSwipe('right')}
          style={[dynamicStyles.button, dynamicStyles.likeButton]}
          contentStyle={dynamicStyles.buttonContent}
          icon="heart"
        >
          {t('matches.like')}
        </Button>
      </View>
    </SafeAreaView>
  )
}

function MatchCard({ profile }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dynamicStyles = styles(theme)

  return (
    <Card style={dynamicStyles.card}>
      <Card.Cover
        source={{ uri: profile.user?.avatar_url || 'https://via.placeholder.com/400' }}
        style={dynamicStyles.cardImage}
      />
      <Card.Content style={dynamicStyles.cardContent}>
        <View style={dynamicStyles.compatibilityBadge}>
          <Text style={dynamicStyles.compatibilityText}>
            {t('matches.compatibility', { percent: profile.compatibility })}
          </Text>
        </View>

        <Text variant="headlineSmall" style={dynamicStyles.userName}>
          {profile.nickname}, {profile.user?.age || '?'}
        </Text>

        {profile.dog && (
          <Text variant="bodyLarge" style={dynamicStyles.dogInfo}>
            {t('matches.withDog', { dogName: profile.dog.name })}
            {'\n'}
            {profile.dog.breed}, {t('matches.yearsOld', { age: profile.dog.age })}
          </Text>
        )}

        {profile.park_name && (
          <Text variant="bodyMedium" style={dynamicStyles.parkInfo}>
            📍 {t('matches.lastSeenAt', { parkName: profile.park_name })}
          </Text>
        )}

        {profile.shared_interests?.length > 0 && (
          <View style={dynamicStyles.interestsContainer}>
            {profile.shared_interests.map((interest, index) => (
              <Chip key={index} style={dynamicStyles.interestChip}>
                {interest}
              </Chip>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.background,
    elevation: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noMoreText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    borderRadius: 8,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStyle: {
    position: 'absolute',
    width: screenWidth - 32,
    height: screenHeight * 0.65,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    height: '60%',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  compatibilityBadge: {
    position: 'absolute',
    top: -20,
    right: 16,
    backgroundColor: theme.colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  compatibilityText: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  userName: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  dogInfo: {
    marginTop: 4,
    color: theme.colors.onSurfaceVariant,
  },
  parkInfo: {
    marginTop: 8,
    color: theme.colors.onSurfaceVariant,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  interestChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    zIndex: 1000,
    transform: [{ rotate: '-30deg' }],
  },
  likeText: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: '800',
    padding: 10,
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    zIndex: 1000,
    transform: [{ rotate: '30deg' }],
  },
  nopeText: {
    borderWidth: 3,
    borderColor: theme.colors.error,
    color: theme.colors.error,
    fontSize: 32,
    fontWeight: '800',
    padding: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 32,
  },
  button: {
    flex: 1,
    borderRadius: 30,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  passButton: {
    backgroundColor: theme.colors.surface,
  },
  likeButton: {
    backgroundColor: theme.colors.primary,
  },
})
