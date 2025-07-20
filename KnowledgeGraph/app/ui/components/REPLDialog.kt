package com.knowledgegraph.app.ui.components

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.viewmodel.PluginViewModel
import kotlinx.coroutines.launch

@Composable
fun REPLDialog(open: Boolean, onDismiss: () -> Unit, pluginViewModel: PluginViewModel) {
    if (!open) return

    var input by remember { mutableStateOf("") }
    val output by pluginViewModel.replOutput.collectAsState()
    val scope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {},
        title = { Text("Clojure Plugin REPL") },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = input,
                    onValueChange = { input = it },
                    placeholder = { Text("Enter :eval (+ 1 2)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                Button(onClick = {
                    scope.launch {
                        pluginViewModel.evaluateCommand(input)
                    }
                }) {
                    Text("Run")
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text("Output:\n$output")
            }
        }
    )
}