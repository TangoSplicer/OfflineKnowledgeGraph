package ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import model.PluginModel
import services.PluginManager
import androidx.lifecycle.viewmodel.compose.viewModel
import viewmodel.PluginViewModel

@Composable
fun PluginBrowserScreen(viewModel: PluginViewModel = viewModel()) {
    val plugins by remember { mutableStateOf(viewModel.loadPlugins()) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Plugin Browser") })
        }
    ) { padding ->
        LazyColumn(
            contentPadding = padding,
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            items(plugins.size) { index ->
                val plugin = plugins[index]
                PluginCard(plugin, viewModel)
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun PluginCard(plugin: PluginModel, viewModel: PluginViewModel) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { viewModel.launch(plugin) },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(plugin.name, style = MaterialTheme.typography.titleMedium)
            Text("by ${plugin.author} | v${plugin.version}", style = MaterialTheme.typography.labelSmall)
            Spacer(modifier = Modifier.height(4.dp))
            Text(plugin.description, style = MaterialTheme.typography.bodySmall)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Tags: ${plugin.tags.joinToString()}", style = MaterialTheme.typography.labelSmall)
                Switch(
                    checked = plugin.enabled,
                    onCheckedChange = { viewModel.toggle(plugin, it) }
                )
            }
        }
    }
}