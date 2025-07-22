
package com.knowledgegraph.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import com.knowledgegraph.app.ui.components.RelationshipEditorDialog
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.knowledgegraph.app.model.GraphNode
import com.knowledgegraph.app.ui.components.GraphCanvas
import com.knowledgegraph.app.ui.components.ReminderCard
import com.knowledgegraph.app.services.VoiceInputManager
import com.knowledgegraph.app.viewmodel.GraphViewModel
import com.knowledgegraph.app.viewmodel.ExportViewModel
import com.knowledgegraph.app.viewmodel.ReminderViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray

@OptIn(ExperimentalMaterial3Api::class)
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
    var showRelationshipEditor by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Knowledge Graph") },
                actions = {
                    IconButton(onClick = { navController.navigate("notes") }) {
                        Icon(Icons.Filled.EditNote, contentDescription = "Open Notes")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    titleContentColor = MaterialTheme.colorScheme.primary
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showRelationshipEditor = true }) {
                Icon(Icons.Default.Add, contentDescription = "Create Relationship")
            }
        }
    ) { paddingValues ->
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
                .padding(paddingValues)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
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
                    IconButton(onClick = {
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
                        Icon(Icons.Default.Search, contentDescription = "Search")
                    }
                    VoiceInputButton { spokenText ->
                        searchQuery = spokenText
                    }
                }

                if (showRelationshipEditor) {
                    RelationshipEditorDialog(
                        graphViewModel = viewModel,
                        onDismiss = { showRelationshipEditor = false }
                    )
                }

                if (searchResults.isNotEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.5f))
                            .padding(horizontal = 16.dp, vertical = 8.dp)
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
                    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                        Text(
                            "Forgotten Knowledge",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        forgottenNodes.forEach { node ->
                            ReminderCard(node = node) {
                                viewModel.setSelectedNodeId(node.id)
                            }
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
    }
}

@Composable
fun VoiceInputButton(onResult: (String) -> Unit) {
    val context = LocalContext.current
    val voiceInputManager = remember {
        VoiceInputManager(
            context = context,
            onResult = { result -> onResult(result) },
            onError = { error -> Toast.makeText(context, error, Toast.LENGTH_SHORT).show() }
        )
    }

    DisposableEffect(Unit) {
        onDispose {
            voiceInputManager.destroy()
        }
    }

    IconButton(onClick = { voiceInputManager.startListening() }) {
        Icon(Icons.Default.Mic, contentDescription = "Voice Search")
    }
}