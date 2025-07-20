package com.knowledgegraph.app.services

import android.util.Log
import com.knowledgegraph.app.bridge.ClojureBridge
import com.knowledgegraph.app.model.GraphEdge
import com.knowledgegraph.app.model.GraphNode
import com.knowledgegraph.app.model.GraphState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString

class GraphService(private val usageStatsManager: UsageStatsManager) {

    private val _graphState = MutableStateFlow(GraphState())
    val graphState: StateFlow<GraphState> = _graphState

    val latestGraphJson: String
        get() = Json.encodeToString(_graphState.value)

    fun updateGraphFromText(noteInput: String) {
        val graphJson = latestGraphJson
        val corrections = usageStatsManager.getCorrectionLogs()

        val payload = buildString {
            append("{:graph ")
            append("\"${graphJson.replace("\"", "\\\"")}\"")
            append(", :text ")
            append("\"${noteInput.replace("\"", "\\\"")}\"")
            append(", :corrections ")
            append(Json.encodeToString(corrections))
            append("}")
        }

        val resultJson = try {
            ClojureBridge.updateGraph(payload)
        } catch (e: Exception) {
            Log.e("GraphService", "Clojure updateGraph failed", e)
            "{\"nodes\":[],\"edges\":[]}"
        }

        Log.d("GraphService", "Updated Graph JSON:\n$resultJson")

        try {
            val newState = Json.decodeFromString<GraphState>(resultJson)
            _graphState.value = newState
        } catch (e: Exception) {
            Log.e("GraphService", "Failed to parse updated graph", e)
        }
    }

    fun addNode(node: GraphNode) {
        val currentState = _graphState.value
        val newNodes = currentState.nodes + node
        val newState = currentState.copy(nodes = newNodes)
        _graphState.value = newState
    }

    fun addEdge(edge: GraphEdge) {
        val currentState = _graphState.value
        val newEdges = currentState.edges + edge
        val newState = currentState.copy(edges = newEdges)
        _graphState.value = newState
    }

    fun getAllNodes(): List<GraphNode> {
        return _graphState.value.nodes
    }

    fun getEdgesForNode(nodeId: String): List<GraphEdge> {
        return _graphState.value.edges.filter { it.source == nodeId || it.target == nodeId }
    }

    fun getNodeById(nodeId: String): GraphNode? {
        return _graphState.value.nodes.find { it.id == nodeId }
    }
}