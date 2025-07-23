
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
        Column(
            modifier = Modifier
                .fillMaxSize()
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
                    var isSearching by remember { mutableStateOf(false) }

                    IconButton(onClick = {
                        isSearching = true
                        coroutineScope.launch {
                            val resultJson = withContext(Dispatchers.IO) {
                                com.knowledgegraph.app.bridge.ClojureBridge
                                    .safeSearchGraph(searchQuery, viewModel.latestGraphJson)
                            }
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
                            } finally {
                                isSearching = false

            // Search bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = { Text("Search your knowledge...") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = "Search Icon")
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

                    }) {
                        if (isSearching) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        } else {
                            Icon(Icons.Default.Search, contentDescription = "Search")
                        }
                    }
                    VoiceInputButton { spokenText ->
                        searchQuery = spokenText
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

            // Graph view
            Box(modifier = Modifier.weight(1f)) {
                GraphCanvas(
                    graph = graphState,
                    selectedNodeId = selectedNodeId,
                    showEdgeWeights = showWeights,
                    onNodeTap = { id -> viewModel.setSelectedNodeId(id) }
                )
            }

            // Bottom sheet for search results and forgotten knowledge
            if (searchResults.isNotEmpty() || forgottenNodes.isNotEmpty()) {
                ModalBottomSheet(
                    onDismissRequest = { /* Handle dismiss */ },
                    sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        if (searchResults.isNotEmpty()) {
                            Text("Search Results", style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(8.dp))
                            LazyColumn {
                                items(searchResults) { (id, label) ->
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
                            Text("Forgotten Knowledge", style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(8.dp))
                            LazyColumn {
                                items(forgottenNodes) { node ->
                                    ReminderCard(node = node) {
                                        viewModel.setSelectedNodeId(node.id)
                                    }
                                }
                            }
                        }
                    }
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