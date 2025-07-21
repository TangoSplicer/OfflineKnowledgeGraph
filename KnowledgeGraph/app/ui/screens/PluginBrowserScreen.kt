package com.knowledgegraph.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.model.PluginMetadata
import com.knowledgegraph.app.services.PluginRegistry

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PluginBrowserScreen() {
    val plugins = remember { PluginRegistry.list() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Plugin Browser") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    titleContentColor = MaterialTheme.colorScheme.primary
                )
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.surface,
                            MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
                        )
                    )
                )
                .padding(padding)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                items(plugins) { plugin ->
                    PluginCard(plugin)
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        }
    }
}

@Composable
fun PluginCard(plugin: PluginMetadata) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(plugin.name, style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(4.dp))
            Text(plugin.description, style = MaterialTheme.typography.bodyMedium)
            Spacer(modifier = Modifier.height(6.dp))
            Text("Author: ${plugin.author}", style = MaterialTheme.typography.labelSmall)
            Text("Version: ${plugin.version}", style = MaterialTheme.typography.labelSmall)
            Text(
                "Compatible: ${if (plugin.compatible) "✅" else "❌"}",
                style = MaterialTheme.typography.labelSmall
            )
            if (plugin.tags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    "Tags: ${plugin.tags.joinToString(", ")}",
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}