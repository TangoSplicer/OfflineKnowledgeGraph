package com.knowledgegraph.app.model

data class GraphState(
    val nodes: List<GraphNode> = emptyList(),
    val edges: List<GraphEdge> = emptyList()
) {
    fun toJson(): String {
        val nodeJson = nodes.joinToString(",", prefix = "[", postfix = "]") {
            """{"id":"${it.id}","label":"${it.label}","type":"${it.type}"}"""
        }
        val edgeJson = edges.joinToString(",", prefix = "[", postfix = "]") {
            """{"source":"${it.source}","target":"${it.target}","relation":"${it.relation}"}"""
        }
        return """{"nodes":$nodeJson,"edges":$edgeJson}"""
    }
}