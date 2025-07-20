package com.knowledgegraph.app

import com.knowledgegraph.app.model.*
import com.knowledgegraph.app.services.GraphService
import org.junit.Assert.*
import org.junit.Test

class GraphServiceTest {

    @Test
    fun testJsonSerialization() {
        val graph = GraphState(
            nodes = listOf(GraphNode("1", "A", NodeType.CONCEPT)),
            edges = listOf(GraphEdge("1", "2", "connects"))
        )

        val json = GraphService.serializeToJson(graph)
        assertTrue(json.contains("nodes"))
        assertTrue(json.contains("edges"))
    }

    @Test
    fun testFactExport() {
        val graph = GraphState(
            nodes = listOf(GraphNode("1", "Test", NodeType.CONCEPT)),
            edges = listOf(GraphEdge("1", "2", "linked"))
        )

        val facts = GraphService.toFactFile(graph)
        assertTrue(facts.contains("entity(1)"))
        assertTrue(facts.contains("edge(1, 2, linked)"))
    }
}