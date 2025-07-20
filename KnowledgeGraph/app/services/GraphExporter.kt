package com.knowledgegraph.app.services

import com.knowledgegraph.app.model.GraphNode
import com.knowledgegraph.app.model.GraphEdge
import java.io.File
import org.json.JSONArray
import org.json.JSONObject

class GraphExporter {

    fun exportGraphToJson(nodes: List<GraphNode>, edges: List<GraphEdge>, outputFile: File) {
        val json = JSONObject()
        val nodeArray = JSONArray()
        val edgeArray = JSONArray()

        nodes.forEach { node ->
            if (node.type == "image" || node.type != null) {
                val jsonNode = JSONObject()
                jsonNode.put("id", node.id)
                jsonNode.put("type", node.type)
                jsonNode.put("attributes", JSONObject(node.attrs))
                nodeArray.put(jsonNode)
            }
        }

        edges.forEach { edge ->
            val jsonEdge = JSONObject()
            jsonEdge.put("from", edge.from)
            jsonEdge.put("to", edge.to)
            jsonEdge.put("type", edge.type)
            edgeArray.put(jsonEdge)
        }

        json.put("nodes", nodeArray)
        json.put("edges", edgeArray)

        outputFile.writeText(json.toString(2))
    }
}