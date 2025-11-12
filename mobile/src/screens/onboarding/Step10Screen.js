// mobile/src/screens/onboarding/Step10Screen.js
import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native'
import {
  Text,
  Button,
  useTheme,
  Portal,
  Modal,
  List,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Toast from 'react-native-toast-message'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'

import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader'
import { onboardingService } from '../../services/api/onboarding'
import { fetchCurrentUser } from '../../store/slices/userSlice'

const { width } = Dimensions.get('window')
const photoSize = (width - 72) / 3 // 24px padding + 2 gaps

const MIN_PHOTOS = 2
const MAX_PHOTOS = 6

export function Step10Screen({ navigation, route }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dispatch = useDispatch()
  const {
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    step5Data,
    step6Data,
    step7Data,
    step8Data,
    step9Data
  } = route.params || {}

  const [photos, setPhotos] = useState([])
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddPhoto = () => {
    if (photos.length >= MAX_PHOTOS) {
      Toast.show({
        type: 'info',
        text1: t('onboarding.step10.maxPhotosReached'),
      })
      return
    }
    setShowImagePicker(true)
  }

  const handleTakePhoto = async () => {
    setShowImagePicker(false)
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      })

      if (!result.didCancel && result.assets && result.assets[0]) {
        const newPhoto = {
          uri: result.assets[0].uri,
          type: 'USER', // Por defecto USER, el usuario puede cambiar
        }
        setPhotos([...photos, newPhoto])
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
    }
  }

  const handleChooseFromGallery = async () => {
    setShowImagePicker(false)
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        selectionLimit: MAX_PHOTOS - photos.length,
      })

      if (!result.didCancel && result.assets) {
        const newPhotos = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'USER',
        }))
        setPhotos([...photos, ...newPhotos].slice(0, MAX_PHOTOS))
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
    }
  }

  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const togglePhotoType = (index) => {
    setPhotos(photos.map((photo, i) => {
      if (i === index) {
        return { ...photo, type: photo.type === 'USER' ? 'DOG' : 'USER' }
      }
      return photo
    }))
  }

  const validate = () => {
    if (photos.length < MIN_PHOTOS) {
      Toast.show({
        type: 'error',
        text1: t('onboarding.step10.minPhotosRequired', { count: MIN_PHOTOS }),
      })
      return false
    }

    const userPhotos = photos.filter(p => p.type === 'USER')
    if (userPhotos.length === 0) {
      Toast.show({
        type: 'error',
        text1: t('onboarding.step10.atLeastOneUserPhoto'),
      })
      return false
    }

    return true
  }

  const handleFinish = async () => {
    if (!validate()) return

    try {
      setLoading(true)

      // TODO: Aquí deberías subir las fotos a tu storage (S3, Cloudinary, etc.)
      // y obtener las URLs. Por ahora usamos las URIs locales.
      const photosData = photos.map(photo => ({
        url: photo.uri, // TODO: Reemplazar con URL del storage
        type: photo.type,
      }))

      // Guardar Step 10
      await onboardingService.saveStep('ONB_PHOTOS', {
        photos: photosData,
      })

      // Completar onboarding
      await onboardingService.completeOnboarding()

      // Actualizar usuario en Redux
      await dispatch(fetchCurrentUser()).unwrap()

      Toast.show({
        type: 'success',
        text1: t('onboarding.step10.success'),
      })

      // La navegación se manejará automáticamente por el AppNavigator
      // cuando se actualice el estado del usuario a onboarded:true

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    navigation.goBack()
  }

  const dynamicStyles = styles(theme)

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <OnboardingHeader
        title={t('onboarding.step10.title')}
        subtitle={t('onboarding.step10.subtitle')}
        currentStep={10}
        totalSteps={10}
        onBack={handlePrevious}
      />

      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Grid de fotos */}
        <View style={dynamicStyles.photosGrid}>
          {[...Array(MAX_PHOTOS)].map((_, index) => {
            const photo = photos[index]
            return (
              <View key={index} style={dynamicStyles.photoSlot}>
                {photo ? (
                  <>
                    <Image source={{ uri: photo.uri }} style={dynamicStyles.photoImage} />
                    <View style={dynamicStyles.photoActions}>
                      <TouchableOpacity
                        style={dynamicStyles.photoAction}
                        onPress={() => togglePhotoType(index)}
                      >
                        <Icon
                          name={photo.type === 'USER' ? 'account' : 'dog'}
                          size={16}
                          color={theme.colors.onPrimary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[dynamicStyles.photoAction, dynamicStyles.removeAction]}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Icon name="close" size={16} color={theme.colors.onPrimary} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    style={dynamicStyles.emptySlot}
                    onPress={handleAddPhoto}
                  >
                    <Icon name="plus" size={32} color={theme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                )}
              </View>
            )
          })}
        </View>

        {/* Contador */}
        <Text variant="bodyMedium" style={dynamicStyles.photoCounter}>
          {photos.length}/{MAX_PHOTOS} {t('onboarding.step10.photosAdded')}
        </Text>

        {/* Botón añadir foto */}
        <Button
          mode="outlined"
          onPress={handleAddPhoto}
          disabled={photos.length >= MAX_PHOTOS}
          icon="camera"
          style={dynamicStyles.addPhotoButton}
        >
          {t('onboarding.step10.addPhoto')}
        </Button>

        {/* Consejos */}
        <TouchableOpacity
          style={dynamicStyles.tipsButton}
          onPress={() => setShowTips(true)}
        >
          <Icon name="lightbulb-outline" size={20} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={dynamicStyles.tipsButtonText}>
            {t('onboarding.step10.photoTips')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={dynamicStyles.footer}>
        <Button
          mode="contained"
          onPress={handleFinish}
          loading={loading}
          disabled={loading || photos.length < MIN_PHOTOS}
          style={dynamicStyles.button}
          icon="check"
        >
          {t('onboarding.step10.finish')}
        </Button>
      </View>

      {/* Modal de selección de imagen */}
      <Portal>
        <Modal
          visible={showImagePicker}
          onDismiss={() => setShowImagePicker(false)}
          contentContainerStyle={dynamicStyles.modalContainer}
        >
          <List.Item
            title={t('onboarding.step10.takePhoto')}
            left={props => <List.Icon {...props} icon="camera" />}
            onPress={handleTakePhoto}
          />
          <List.Item
            title={t('onboarding.step10.chooseFromGallery')}
            left={props => <List.Icon {...props} icon="image" />}
            onPress={handleChooseFromGallery}
          />
          <List.Item
            title={t('common.cancel')}
            left={props => <List.Icon {...props} icon="close" />}
            onPress={() => setShowImagePicker(false)}
          />
        </Modal>

        {/* Modal de consejos */}
        <Modal
          visible={showTips}
          onDismiss={() => setShowTips(false)}
          contentContainerStyle={dynamicStyles.modalContainer}
        >
          <Text variant="titleLarge" style={dynamicStyles.tipsTitle}>
            {t('onboarding.step10.tipsTitle')}
          </Text>
          <View style={dynamicStyles.tipsList}>
            <View style={dynamicStyles.tipItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={dynamicStyles.tipText}>
                {t('onboarding.step10.tip1')}
              </Text>
            </View>
            <View style={dynamicStyles.tipItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={dynamicStyles.tipText}>
                {t('onboarding.step10.tip2')}
              </Text>
            </View>
            <View style={dynamicStyles.tipItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={dynamicStyles.tipText}>
                {t('onboarding.step10.tip3')}
              </Text>
            </View>
            <View style={dynamicStyles.tipItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={dynamicStyles.tipText}>
                {t('onboarding.step10.tip4')}
              </Text>
            </View>
          </View>
          <Button onPress={() => setShowTips(false)}>
            {t('common.close')}
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  )
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  photoSlot: {
    width: photoSize,
    height: photoSize,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  photoAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAction: {
    backgroundColor: 'rgba(239,68,68,0.9)',
  },
  emptySlot: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCounter: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
  },
  addPhotoButton: {
    marginTop: 24,
  },
  tipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  tipsButtonText: {
    color: theme.colors.primary,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 8,
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    lineHeight: 20,
  },
})
