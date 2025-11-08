package com.parkdog.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = BuildConfigModule.NAME)
class BuildConfigModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  override fun getConstants(): Map<String, Any?> {
    return mapOf(
      "API_URL" to BuildConfig.API_URL,
      "WS_URL" to BuildConfig.WS_URL,
      "GOOGLE_WEB_CLIENT_ID" to BuildConfig.GOOGLE_WEB_CLIENT_ID,
      "GOOGLE_ANDROID_CLIENT_ID" to BuildConfig.GOOGLE_ANDROID_CLIENT_ID
    )
  }

  companion object {
    const val NAME = "BuildConfig"
  }
}
