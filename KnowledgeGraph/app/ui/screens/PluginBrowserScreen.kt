package com.knowledgegraph.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.model.PluginMetadata
import com.knowledgegraph.app.services.PluginRegistry

@Composable
fun PluginBrowserScreen() {
    val plugins = remember { PluginRegistry.list() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Plugin Browser") }
            )
        }
    ) { padding ->
        LazyColumn(modifier = Modifier
            .fillMaxSize()
            .padding(padding)
            .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            items(plugins) { plugin ->
                PluginCard(plugin)
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
fun PluginCard(plugin: PluginMetadata) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(plugin.name, style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(4.dp))
            Text(plugin.description, style = MaterialTheme.typography.bodyMedium)
            Spacer(modifier = Modifier.height(6.dp))
            Text("Author: ${plugin.author}", style = MaterialTheme.typography.labelSmall)
            Text("Version: ${plugin.version}", style = MaterialTheme.typography.labelSmall)
            Text("Compatible: ${if (plugin.compatible) "✅" else "❌"}", style = MaterialTheme.typography.labelSmall)
            if (plugin.tags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text("Tags: ${plugin.tags.joinToString(", ")}", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}