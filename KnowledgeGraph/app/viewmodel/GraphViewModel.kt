package com.knowledgegraph.app.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import com.knowledgegraph.app.bridge.ClojureBridge
import com.knowledgegraph.app.model.*
import com.knowledgegraph.app.services.GraphServiceProvider
import com.knowledgegraph.app.services.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate

class GraphViewModel(private val context: Context) : ViewModel(), GraphServiceProvider {
    lateinit var graphService: GraphService

    override fun getGraphService(): GraphService {
        return graphService
    }

    private val _graphState = MutableStateFlow(GraphState())
    val graphState = _graphState.asStateFlow()

    private val _interactionLog = MutableStateFlow<List<String>>(emptyList())
    val interactionLog = _interactionLog.asStateFlow()

    private val _selectedNodeId = MutableStateFlow<String?>(null)
    val selectedNodeId = _selectedNodeId.asStateFlow()

    private val _showEdgeWeights = MutableStateFlow(false)
    val showEdgeWeights = _showEdgeWeights.asStateFlow()

    private val _graphFullState = MutableStateFlow(GraphState())
    private val _currentFilterDate = MutableStateFlow<LocalDate?>(null)
    val currentFilterDate = _currentFilterDate.asStateFlow()

    var latestGraphJson: String = ""

    init {
        graphService = GraphService(UsageStatsManager(context))
        // Plugin metadata registry init
        PluginRegistry.load(context)
    }

    fun setSelectedNodeId(id: String?) {
        _selectedNodeId.value = id
    }

    fun toggleEdgeWeightVisibility() {
        _showEdgeWeights.value = !_showEdgeWeights.value
    }

    fun updateGraphFromText(text: String) {
        val payload = mapOf(
            "graph" to latestGraphJson,
            "text" to text,
            "interacted" to interactionLog.value.distinct()
        )
        val payloadJson = Gson().toJson(payload)

        val result = ClojureBridge.safeUpdateGraph(payloadJson)
        latestGraphJson = result
        try {
            val parsed = GraphState.fromJson(JSONObject(result))
            _graphState.value = parsed
            _graphFullState.value = parsed

            parsed.nodes.filter { it.label.contains("contradiction", true) }.forEach { node ->
                GraphAnnotationManager.addAnnotation(
                    nodeId = node.id,
                    message = "Contradiction detected: ${node.label}",
                    type = AnnotationType.CONTRADICTION
                )
            }
        } catch (e: JSONException) {
            _uiState.value = GraphUiState.Error("Failed to parse graph data: ${e.message}")
        }
    }

    fun submitVoiceInput(transcribedText: String) {
        val entry = transcribedText.trim()
        if (entry.isNotBlank()) {
            _interactionLog.value = _interactionLog.value + entry
            updateGraphFromText(entry)
        }
    }

    fun getSelectedNote(): Pair<String, NoteType>? {
        val nodeId = _selectedNodeId.value
        val node = _graphState.value.nodes.find { it.id == nodeId }
        return if (node?.notePath != null && node.noteType != null) {
            node.notePath to node.noteType
        } else null
    }

    fun getAnnotations(nodeId: String): List<GraphAnnotation> {
        return GraphAnnotationManager.getAnnotations(nodeId)
    }

    fun exportForgottenNodes(context: Context): Boolean {
        val forgotten = getForgottenNodes()
        val nodes = forgotten.mapNotNull { id ->
            graphState.value.nodes.find { it.id == id }?.let { id to it.label }
        }
        return FileUtils.exportForgottenNodes(context, nodes)
    }

    fun getForgottenNodes(): List<String> {
        val allIds = graphState.value.nodes.map { it.id }.toSet()
        val recent = interactionLog.value.toSet()
        return allIds.minus(recent).toList()
    }

    fun fetchPluginSuggestions(): List<String> {
        val graphJson = latestGraphJson
        val interactions = interactionLog.value.distinct().joinToString(
            prefix = "[\"", separator = "\", \"", postfix = "\"]"
        )
        val payload = """{:graph "${graphJson.replace("\"", "\\\"")}", :interacted $interactions}"""

        val result = ClojureBridge.safeGetPluginSuggestions(payload)
        return try {
            val jsonArray = JSONArray(result)
            (0 until jsonArray.length()).map { i ->
                val obj = jsonArray.getJSONObject(i)
                val label = obj.optString("label")
                val payloadObj = obj.optJSONObject("result")?.toString() ?: "{}"
                "$label → $payloadObj"
            }
        } catch (_: Exception) {
            listOf("Error parsing plugin result")
        }
    }

    fun getAvailablePlugins(): List<PluginMetadata> {
        return PluginRegistry.list()
    }

    fun executePluginActions(): List<String> {
        val graphJson = latestGraphJson
        val interactions = interactionLog.value.distinct()
        val payload = mapOf(
            "graph" to graphJson,
            "interacted" to interactions
        )
        val payloadJson = Gson().toJson(payload)
        val result = ClojureBridge.safeGetPluginSuggestions(payloadJson)

        return try {
            val json = Json { ignoreUnknownKeys = true }
            val suggestions = json.decodeFromString<List<PluginSuggestion>>(result)
            val newGraph = JSONObject(latestGraphJson)

            suggestions.forEach { suggestion ->
                suggestion.result?.let { result ->
                    if (result.action == "tag") {
                        val nodeArr = newGraph.getJSONArray("nodes")
                        for (j in 0 until nodeArr.length()) {
                            val node = nodeArr.getJSONObject(j)
                            if (node.optString("id") == result.nodeId) {
                                val meta = node.optJSONObject("meta") ?: JSONObject()
                                meta.put("tags", result.tags)
                                node.put("meta", meta)
                            }
                        }
                    }
                }
            }

            latestGraphJson = newGraph.toString()
            _graphState.value = GraphState.fromJson(newGraph)
            listOf("Actions applied successfully.")
        } catch (e: Exception) {
            listOf("Failed to apply plugin actions: ${e.message}")
        }
    }

    fun filterGraphByDate(cutoff: LocalDate) {
        _currentFilterDate.value = cutoff
        val filtered = _graphFullState.value.copy(
            nodes = _graphFullState.value.nodes.filter {
                it.meta.timestamp?.isBefore(cutoff) ?: true
            },
            edges = _graphFullState.value.edges
        )
        _graphState.value = filtered
    }

    fun resetGraphFilter() {
        _graphState.value = _graphFullState.value
        _currentFilterDate.value = null
    }

    fun logInteractionEvent(context: Context, label: String) {
        UsageStatsManager(context).logEvent("Graph: $label")
    }

    fun createRelationship(sourceNodeId: String, targetNodeId: String, relationshipType: String) {
        graphService.addEdge(
            com.knowledgegraph.app.model.GraphEdge(
                source = sourceNodeId,
                target = targetNodeId,
                type = relationshipType
            )
        )
    }
}