package com.knowledgegraph.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.services.AppTheme
import com.knowledgegraph.app.services.ThemeManager

@Composable
fun ThemeSelectorScreen() {
    val current = ThemeManager.currentTheme
    var selected by remember { mutableStateOf(current) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Choose App Theme") })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.Top,
            horizontalAlignment = Alignment.Start
        ) {
            Text("Select Theme:", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(16.dp))

            AppTheme.values().forEach { theme ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    RadioButton(
                        selected = selected == theme,
                        onClick = { selected = theme }
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(theme.name)
                }
            }

            Spacer(Modifier.height(24.dp))

            Button(onClick = { ThemeManager.setTheme(selected) }) {
                Text("Apply")
            }
        }
    }
}