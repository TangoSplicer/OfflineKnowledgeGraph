package com.knowledgegraph.app.ui.screens

import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.services.PluginManager
import com.knowledgegraph.app.model.PluginMetadata

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
            TopAppBar(title = { Text("Plugin Registry") })
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            plugins.forEach { plugin ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(plugin.name, style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(4.dp))
                        Text(plugin.description, style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(8.dp))
                        Text("Author: ${plugin.author}", style = MaterialTheme.typography.labelSmall)
                        Spacer(Modifier.height(8.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Enabled")
                            Spacer(modifier = Modifier.width(8.dp))
                            Switch(
                                checked = plugin.enabled,
                                onCheckedChange = {
                                    PluginManager.togglePlugin(context, plugin.id, it)
                                    plugins = PluginManager.listPlugins(context)
                                }
                            )
                        }
                    }
                }
            }

            if (plugins.isEmpty()) {
                Spacer(Modifier.height(24.dp))
                Text("No plugins installed.", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}