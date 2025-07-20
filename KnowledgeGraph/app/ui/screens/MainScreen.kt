
package com.knowledgegraph.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.knowledgegraph.app.model.GraphNode
import com.knowledgegraph.app.ui.components.GraphCanvas
import com.knowledgegraph.app.ui.components.ReminderCard
import com.knowledgegraph.app.viewmodel.GraphViewModel
import com.knowledgegraph.app.viewmodel.ExportViewModel
import com.knowledgegraph.app.viewmodel.ReminderViewModel
import com.knowledgegraph.app.ui.screens.ExportScreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray

@Composable
fun MainScreen(
    viewModel: GraphViewModel,
    reminderViewModel: ReminderViewModel,
    navController: NavController
) {
    val graphState by viewModel.graphState.collectAsState()
    val selectedNodeId by viewModel.selectedNodeId.collectAsState()
    val showWeights by viewModel.showEdgeWeights.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<Pair<String, String>>>(emptyList()) }
    val forgottenNodes by reminderViewModel.forgottenNodes.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Search, contentDescription = "Search")
            Spacer(modifier = Modifier.width(6.dp))
            BasicTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.weight(1f),
                singleLine = true,
                decorationBox = { innerTextField ->
                    if (searchQuery.isEmpty()) {
                        Text("Search your knowledge...", color = Color.Gray)
                    }
                    innerTextField()
                }
            )
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = {
                coroutineScope.launch(Dispatchers.IO) {
                    val resultJson = com.knowledgegraph.app.bridge.ClojureBridge
                        .safeSearchGraph(searchQuery, viewModel.latestGraphJson)
                    try {
                        val parsed = JSONArray(resultJson)
                        val results = mutableListOf<Pair<String, String>>()
                        for (i in 0 until parsed.length()) {
                            val obj = parsed.getJSONObject(i)
                            results.add(obj.optString("id") to obj.optString("label"))
                        }
                        searchResults = results
                    } catch (e: Exception) {
                        searchResults = emptyList()
                        Toast.makeText(context, "Search failed", Toast.LENGTH_SHORT).show()
                    }
                }
            }) {
                Text("Go")
            }
            IconButton(onClick = { navController.navigate("notes") }) {
                Icon(Icons.Filled.EditNote, contentDescription = "Open Notes")
            }
        }

        if (searchResults.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 8.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text("Results:", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(4.dp))
                searchResults.forEach { (id, label) ->
                    TextButton(onClick = {
                        viewModel.setSelectedNodeId(id)
                        Toast.makeText(context, "Selected: $label", Toast.LENGTH_SHORT).show()
                    }) {
                        Text(label)
                    }
                }
            }
        }

        if (forgottenNodes.isNotEmpty()) {
            Text(
                "Forgotten Knowledge",
                modifier = Modifier.padding(start = 16.dp, top = 8.dp),
                style = MaterialTheme.typography.titleMedium
            )
            forgottenNodes.forEach { node ->
                ReminderCard(node = node) {
                    viewModel.setSelectedNodeId(node.id)
                }
            }
        }

        Box(modifier = Modifier.weight(1f)) {
            GraphCanvas(
                graph = graphState,
                selectedNodeId = selectedNodeId,
                showEdgeWeights = showWeights,
                onNodeTap = { id -> viewModel.setSelectedNodeId(id) }
            )
        }
    }
}

// [END FILE]