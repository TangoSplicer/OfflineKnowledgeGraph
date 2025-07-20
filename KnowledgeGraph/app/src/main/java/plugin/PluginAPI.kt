package plugin

import com.knowledgegraph.app.model.GraphEdge
import com.knowledgegraph.app.model.GraphNode
import com.knowledgegraph.app.services.GraphService

import java.util.UUID

class PluginAPI(private val graphService: GraphService) {

    fun createNode(label: String, type: String): GraphNode {
        val newNode = GraphNode(id = UUID.randomUUID().toString(), label = label, tags = setOf(type))
        graphService.addNode(newNode)
        return newNode
    }

    fun createEdge(source: GraphNode, target: GraphNode, type: String): GraphEdge {
        val newEdge = GraphEdge(source = source.id, target = target.id, type = type)
        graphService.addEdge(newEdge)
        return newEdge
    }

    fun findNodesByLabel(label: String): List<GraphNode> {
        return graphService.getAllNodes().filter { it.label.equals(label, ignoreCase = true) }
    }

    fun getNeighbors(node: GraphNode): List<GraphNode> {
        return graphService.getEdgesForNode(node.id).mapNotNull { edge ->
            val neighborId = if (edge.source == node.id) edge.target else edge.source
            graphService.getNodeById(neighborId)
        }
    }
}
