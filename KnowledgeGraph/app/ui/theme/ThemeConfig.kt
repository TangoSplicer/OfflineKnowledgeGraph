package com.knowledgegraph.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import com.knowledgegraph.app.services.AppTheme
import com.knowledgegraph.app.services.ThemeManager

@Composable
fun KnowledgeGraphTheme(content: @Composable () -> Unit) {
    val theme = ThemeManager.currentTheme

    val colorScheme = when (theme) {
        AppTheme.LIGHT -> lightColorScheme()
        AppTheme.DARK -> darkColorScheme()
        AppTheme.AMOLED -> darkColorScheme(
            background = androidx.compose.ui.graphics.Color.Black,
            surface = androidx.compose.ui.graphics.Color.Black
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}