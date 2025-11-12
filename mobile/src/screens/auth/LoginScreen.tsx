import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configurar Google Sign In
GoogleSignin.configure({
  webClientId: '301209986798-fuk4h414g85ljkaho0b4hgn6qgb4o16p.apps.googleusercontent.com',
  offlineAccess: true,
});

export function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const dynamicStyles = styles(theme);

  const features = [
    t('auth.features.registerVisits'),
    t('auth.features.meetOwners'),
    t('auth.features.matchInterests'),
    t('auth.features.chatCoordinate'),
  ];

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // Verificar servicios de Google Play
      await GoogleSignin.hasPlayServices();

      // Realizar login
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);

      // Verificar que tenemos la información necesaria
      if (!userInfo?.data?.idToken && !userInfo?.data?.accessToken) {
        throw new Error('No se pudo obtener el token de Google');
      }

      // Por ahora solo mostramos el resultado
      Alert.alert(
        'Login Exitoso',
        `Bienvenido ${userInfo.data.user?.name || 'Usuario'}!`
      );

    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        t('auth.loginError'),
        error.message || 'Error desconocido'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.iconContainer}>
            <Text style={dynamicStyles.iconText}>🐕</Text>
          </View>

          <Text style={dynamicStyles.title}>
            {t('auth.loginTitle')}
          </Text>

          <Text style={dynamicStyles.subtitle}>
            {t('auth.loginSubtitle')}
          </Text>
        </View>

        <View style={dynamicStyles.featuresCard}>
          <Text style={dynamicStyles.featuresTitle}>
            {t('auth.whatCanYouDo')}
          </Text>

          {features.map((feature, index) => (
            <View key={index} style={dynamicStyles.featureItem}>
              <Text style={dynamicStyles.featureBullet}>✓</Text>
              <Text style={dynamicStyles.featureText}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        <View style={dynamicStyles.loginSection}>
          <TouchableOpacity
            style={[
              dynamicStyles.loginButton,
              loading && dynamicStyles.loginButtonDisabled
            ]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <>
                <Text style={dynamicStyles.loginButtonIcon}>G</Text>
                <Text style={dynamicStyles.loginButtonText}>
                  {t('auth.loginWithGoogle')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={dynamicStyles.termsText}>
            {t('auth.termsAccept')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: 32,
  },
  featuresCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    color: theme.colors.primary,
    fontSize: 18,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  loginSection: {
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonDisabled: {
    backgroundColor: theme.colors.onSurfaceVariant,
  },
  loginButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.background,
    marginRight: 8,
  },
  loginButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    marginTop: 16,
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
});
