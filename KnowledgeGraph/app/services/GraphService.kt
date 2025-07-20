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

class GraphService {

    private val _graphState = MutableStateFlow(GraphState())
    val graphState: StateFlow<GraphState> = _graphState

    val latestGraphJson: String
        get() = Json.encodeToString(_graphState.value)

    fun updateGraphFromText(noteInput: String) {
        val graphJson = latestGraphJson

        val payload = buildString {
            append("{:graph ")
            append("\"${graphJson.replace("\"", "\\\"")}\"")
            append(", :text ")
            append("\"${noteInput.replace("\"", "\\\"")}\"")
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
}