// mobile/src/screens/matches/DiscoverScreen.js
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

import { useMatches } from '../../hooks/useMatches'
import { matchService } from '../../services/api/matches'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
const SWIPE_THRESHOLD = 0.25 * screenWidth
const SWIPE_OUT_DURATION = 250

export function DiscoverScreen({ navigation }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { suggestions, loading, refetch } = useMatches()
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
    
    try {
      const response = await matchService.createMatch(currentSuggestion.user_id, action)
      
      if (response.is_mutual) {
        Toast.show({
          type: 'success',
          text1: t('matches.itsAMatch'),
          text2: t('matches.mutualLike'),
        })
      }
    } catch (error) {
      console.error('Match error:', error)
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
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text variant="bodyLarge">{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (currentIndex >= suggestions.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text variant="headlineSmall" style={styles.noMoreText}>
            {t('matches.noMoreSuggestions')}
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              setCurrentIndex(0)
              refetch()
            }}
            style={styles.refreshButton}
          >
            {t('common.refresh')}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">{t('matches.tabs.discover')}</Text>
      </View>

      <View style={styles.cardContainer}>
        {suggestions[currentIndex + 1] && (
          <Animated.View
            style={[
              styles.cardStyle,
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
          style={[rotateAndTranslate, styles.cardStyle]}
        >
          <Animated.View
            style={[
              styles.likeLabel,
              {
                opacity: likeOpacity,
              },
            ]}
          >
            <Text style={styles.likeText}>{t('matches.likeButton')}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.nopeLabel,
              {
                opacity: nopeOpacity,
              },
            ]}
          >
            <Text style={styles.nopeText}>{t('matches.nopeButton')}</Text>
          </Animated.View>

          <MatchCard profile={currentSuggestion} />
        </Animated.View>
      </View>

      <View style={styles.buttonsContainer}>
        <Button
          mode="contained-tonal"
          onPress={() => forceSwipe('left')}
          style={[styles.button, styles.passButton]}
          contentStyle={styles.buttonContent}
          icon="close"
        >
          {t('matches.pass')}
        </Button>
        
        <Button
          mode="contained"
          onPress={() => forceSwipe('right')}
          style={[styles.button, styles.likeButton]}
          contentStyle={styles.buttonContent}
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
  
  return (
    <Card style={styles.card}>
      <Card.Cover 
        source={{ uri: profile.user?.avatar_url || 'https://via.placeholder.com/400' }}
        style={styles.cardImage}
      />
      <Card.Content style={styles.cardContent}>
        <View style={styles.compatibilityBadge}>
          <Text style={styles.compatibilityText}>
            {t('matches.compatibility', { percent: profile.compatibility })}
          </Text>
        </View>
        
        <Text variant="headlineSmall" style={styles.userName}>
          {profile.nickname}, {profile.user?.age || '?'}
        </Text>
        
        {profile.dog && (
          <Text variant="bodyLarge" style={styles.dogInfo}>
            {t('matches.withDog', { dogName: profile.dog.name })}
            {'\n'}
            {profile.dog.breed}, {t('matches.yearsOld', { age: profile.dog.age })}
          </Text>
        )}
        
        {profile.park_name && (
          <Text variant="bodyMedium" style={styles.parkInfo}>
            📍 {t('matches.lastSeenAt', { parkName: profile.park_name })}
          </Text>
        )}
        
        {profile.shared_interests?.length > 0 && (
          <View style={styles.interestsContainer}>
            {profile.shared_interests.map((interest, index) => (
              <Chip key={index} style={styles.interestChip}>
                {interest}
              </Chip>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
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
    backgroundColor: '#ff4458',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  compatibilityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userName: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  dogInfo: {
    marginTop: 4,
    color: '#666',
  },
  parkInfo: {
    marginTop: 8,
    color: '#666',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#e3f2fd',
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
    borderColor: '#4caf50',
    color: '#4caf50',
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
    borderColor: '#ff4458',
    color: '#ff4458',
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
    backgroundColor: '#f5f5f5',
  },
  likeButton: {
    backgroundColor: '#4caf50',
  },
})