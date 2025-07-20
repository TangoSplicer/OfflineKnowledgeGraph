package com.knowledgegraph.app.services

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

enum class AppTheme { LIGHT, DARK, AMOLED }

object ThemeManager {
    private const val PREFS_NAME = "theme_prefs"
    private const val KEY_THEME = "selected_theme"

    private lateinit var prefs: SharedPreferences
    var currentTheme by mutableStateOf(AppTheme.DARK)
        private set

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val themeOrdinal = prefs.getInt(KEY_THEME, AppTheme.DARK.ordinal)
        currentTheme = AppTheme.values()[themeOrdinal]
    }

    fun setTheme(theme: AppTheme) {
        currentTheme = theme
        prefs.edit().putInt(KEY_THEME, theme.ordinal).apply()
    }
}