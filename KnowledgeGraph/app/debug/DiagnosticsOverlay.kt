package com.knowledgegraph.app.debug

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.bridge.ClojureBridge
import com.knowledgegraph.app.bridge.LispBridge
import com.knowledgegraph.app.bridge.MercuryBridge
import com.knowledgegraph.app.viewmodel.GraphViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

@Composable
fun DiagnosticsOverlay(viewModel: GraphViewModel, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    var time by remember { mutableStateOf(System.currentTimeMillis()) }
    var clojureVersion by remember { mutableStateOf("Loading...") }
    var lispVersion by remember { mutableStateOf("Loading...") }
    var mercuryVersion by remember { mutableStateOf("Loading...") }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            time = System.currentTimeMillis()
        }
    }

    LaunchedEffect(true) {
        withContext(Dispatchers.IO) {
            try {
                clojureVersion = ClojureBridge.getClojureVersion()
                lispVersion = LispBridge.getLispVersion()
                mercuryVersion = MercuryBridge.getMercuryVersion()
            } catch (e: UnsatisfiedLinkError) {
                clojureVersion = "Unavailable"
                lispVersion = "Unavailable"
                mercuryVersion = "Unavailable"
            }
        }
    }

    val scrollState = rememberScrollState()
    val graphState by viewModel.graphState.collectAsState()
    val interactionLog by viewModel.interactionLog.collectAsState()
    val forgottenNodes = viewModel.getForgottenNodes()
    val showWeights by viewModel.showEdgeWeights.collectAsState()

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.9f))
            .padding(12.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.Start
    ) {
        Text("Diagnostics", fontWeight = FontWeight.Bold, color = Color.Magenta)
        Text("Current Time: $time")
        Text("Clojure Bridge: $clojureVersion")
        Text("Lisp Bridge: $lispVersion")
        Text("Mercury Bridge: $mercuryVersion")

        Spacer(modifier = Modifier.height(8.dp))
        Text("Node Count: ${graphState.nodes.size}")
        Text("Edge Count: ${graphState.edges.size}")

        Spacer(modifier = Modifier.height(8.dp))
        Text("Recent Interactions:")
        interactionLog.takeLast(5).reversed().forEach { id ->
            val label = graphState.nodes.find { it.id == id }?.label ?: "Unknown"
            Text("• [$id] $label")
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text("Forgotten Nodes:")
        forgottenNodes.take(5).forEach { id ->
            val label = graphState.nodes.find { it.id == id }?.label ?: "Unknown"
            Text("• [$id] $label")
        }

        Spacer(modifier = Modifier.height(12.dp))
        Button(onClick = { viewModel.toggleEdgeWeightVisibility() }) {
            Text(if (showWeights) "Hide Edge Weights" else "Show Edge Weights")
        }

        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = {
            val success = viewModel.exportForgottenNodes(context)
            Toast.makeText(
                context,
                if (success) "Exported to forgotten_nodes.edn" else "Export failed",
                Toast.LENGTH_SHORT
            ).show()
        }) {
            Text("Export Forgotten Nodes")
        }

        Spacer(modifier = Modifier.height(12.dp))
        Text("Plugins", fontWeight = FontWeight.Bold)
        val suggestions = viewModel.fetchPluginSuggestions()
        suggestions.forEach {
            Text("• $it")
        }

        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = {
            val messages = viewModel.executePluginActions()
            Toast.makeText(context, messages.joinToString("\n"), Toast.LENGTH_SHORT).show()
        }) {
            Text("Apply Plugin Actions")
        }
    }
}