package com.knowledgegraph.app.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color

val LightColors = lightColorScheme(
    primary = Color(0xFF2A9D8F),
    onPrimary = Color.White,
    background = Color(0xFFFAFAFA),
    surface = Color.White,
    onSurface = Color.Black,
    error = Color(0xFFE63946),
    onError = Color.White
)

val DarkColors = darkColorScheme(
    primary = Color(0xFF2A9D8F),
    onPrimary = Color.Black,
    background = Color(0xFF121212),
    surface = Color(0xFF1E1E1E),
    onSurface = Color.White,
    error = Color(0xFFE63946),
    onError = Color.Black
)