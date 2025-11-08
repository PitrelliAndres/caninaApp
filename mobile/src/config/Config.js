// Simple config module to access BuildConfig values
import { NativeModules, Platform } from 'react-native'

const { BuildConfig } = NativeModules

const Config = {
  API_URL: BuildConfig?.API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api'),
  WS_URL: BuildConfig?.WS_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000'),
  GOOGLE_WEB_CLIENT_ID: BuildConfig?.GOOGLE_WEB_CLIENT_ID || '301209986798-fuk4h414g85ljkaho0b4hgn6qgb4o16p.apps.googleusercontent.com',
  GOOGLE_ANDROID_CLIENT_ID: BuildConfig?.GOOGLE_ANDROID_CLIENT_ID || ''
}

export default Config
