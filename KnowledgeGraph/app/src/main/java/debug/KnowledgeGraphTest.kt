package com.knowledgegraph.test

import org.junit.Assert.*
import org.junit.Test
import com.knowledgegraph.model.KnowledgeGraph
import com.knowledgegraph.model.KnowledgeNode
import com.knowledgegraph.model.KnowledgeEdge

class KnowledgeGraphTest {
    @Test
    fun testAddNodeAndEdge() {
        val graph = KnowledgeGraph()
        val nodeA = KnowledgeNode("a", "Person", mapOf("name" to "Alice"))
        val nodeB = KnowledgeNode("b", "Person", mapOf("name" to "Bob"))
        graph.addNode(nodeA)
        graph.addNode(nodeB)
        graph.addEdge(KnowledgeEdge("a", "b", "knows"))
        assertEquals(2, graph.nodes.size)
        assertEquals(1, graph.edges.size)
    }
}