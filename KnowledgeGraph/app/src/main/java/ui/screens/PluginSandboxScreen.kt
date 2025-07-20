package ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import model.PluginModel
import services.PluginManager

@Composable
fun PluginSandboxScreen(plugin: PluginModel, pluginManager: PluginManager = PluginManager(LocalContext.current)) {
    var output by remember { mutableStateOf("No output yet.") }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Plugin Sandbox: ${plugin.name}") })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize()
        ) {
            Button(
                onClick = { output = pluginManager.launchPlugin(plugin) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Run Plugin")
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text("Output:", style = MaterialTheme.typography.titleSmall)
            Divider()
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(top = 8.dp)
            ) {
                Text(output, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}