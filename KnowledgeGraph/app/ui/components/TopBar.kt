package com.knowledgegraph.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopBar(
    onRunInference: () -> Unit,
    onExport: () -> Unit,
    onToggleMode: () -> Unit,
    isReasoning: Boolean,
    onOpenRepl: () -> Unit
) {
    CenterAlignedTopAppBar(
        title = { Text("Adaptive Knowledge Graph") },
        actions = {
            IconButton(onClick = onRunInference) {
                Icon(Icons.Filled.Rule, contentDescription = "Run Reasoning")
            }
            IconButton(onClick = onExport) {
                Icon(Icons.Filled.Download, contentDescription = "Export Graph")
            }
            IconButton(onClick = onToggleMode) {
                Icon(Icons.Filled.PlayArrow, contentDescription = "Toggle Mode")
            }
            IconButton(onClick = onOpenRepl) {
                Icon(Icons.Filled.Terminal, contentDescription = "Open REPL")
            }
        }
    )
}