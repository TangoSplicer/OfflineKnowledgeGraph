package com.knowledgegraph.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.model.PluginMetadata
import com.knowledgegraph.app.services.PluginManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PluginRegistryScreen() {
    val context = LocalContext.current
    var plugins by remember { mutableStateOf(emptyList<PluginMetadata>()) }

    LaunchedEffect(Unit) {
        PluginManager.ensurePluginDir(context)
        plugins = PluginManager.listPlugins(context)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Plugin Registry") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    titleContentColor = MaterialTheme.colorScheme.primary
                )
            )
        }
    ) { innerPadding ->
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
                .padding(innerPadding)
        ) {
            if (plugins.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No plugins installed.", style = MaterialTheme.typography.bodyLarge)
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    items(plugins) { plugin ->
                        PluginRegistryCard(plugin) {
                            PluginManager.togglePlugin(context, plugin.id, it)
                            plugins = PluginManager.listPlugins(context)
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun PluginRegistryCard(plugin: PluginMetadata, onToggle: (Boolean) -> Unit) {
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
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Enabled")
                Spacer(modifier = Modifier.weight(1f))
                Switch(
                    checked = plugin.enabled,
                    onCheckedChange = onToggle
                )
            }
        }
    }
}