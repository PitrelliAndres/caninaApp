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
import { useTranslation } from 'react-i18next';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configurar Google Sign In
GoogleSignin.configure({
  webClientId: '301209986798-fuk4h414g85ljkaho0b4hgn6qgb4o16p.apps.googleusercontent.com',
  offlineAccess: true,
});

export function LoginScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🐕</Text>
          </View>

          <Text style={styles.title}>
            {t('auth.loginTitle')}
          </Text>

          <Text style={styles.subtitle}>
            {t('auth.loginSubtitle')}
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>
            {t('auth.whatCanYouDo')}
          </Text>

          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.loginSection}>
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && styles.loginButtonDisabled
            ]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginButtonIcon}>G</Text>
                <Text style={styles.loginButtonText}>
                  {t('auth.loginWithGoogle')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            {t('auth.termsAccept')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#e3f2fd',
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
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 32,
  },
  featuresCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    color: '#4caf50',
    fontSize: 18,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  loginSection: {
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#4285F4',
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
    backgroundColor: '#999',
  },
  loginButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    marginTop: 16,
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
});
