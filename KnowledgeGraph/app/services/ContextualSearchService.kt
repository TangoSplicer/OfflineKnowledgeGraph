package com.knowledgegraph.services

import com.knowledgegraph.model.GraphNode
import com.knowledgegraph.model.GraphEdge
import edu.stanford.nlp.pipeline.StanfordCoreNLP
import java.util.*

/**
 * Service for performing contextual search and pattern-based graph traversal.
 * Uses edge types, node metadata, and local tags to build context-aware queries.
 */
class ContextualSearchService(private val graphService: GraphService) {

    private val pipeline: StanfordCoreNLP

    init {
        val props = Properties()
        props.setProperty("annotators", "tokenize,ssplit,pos,lemma,ner,depparse")
        pipeline = StanfordCoreNLP(props)
    }

    /**
     * Search nodes by approximate label with optional context tags.
     */
    fun searchNodes(labelQuery: String, contextTags: Set<String> = emptySet()): List<GraphNode> {
        return graphService.getAllNodes().filter { node ->
            val labelMatch = node.label.contains(labelQuery, ignoreCase = true)
            val tagMatch = contextTags.isEmpty() || contextTags.intersect(node.tags).isNotEmpty()
            labelMatch && tagMatch
        }
    }

    /**
     * Explore nodes connected to a given node, filtered by relationship type or tag context.
     */
    fun exploreContext(nodeId: String, relationshipTypes: Set<String> = emptySet(), tagFilters: Set<String> = emptySet()): List<GraphNode> {
        val relatedEdges = graphService.getEdgesForNode(nodeId)
        val filteredEdges = relatedEdges.filter { edge ->
            relationshipTypes.isEmpty() || relationshipTypes.contains(edge.type)
        }

        return filteredEdges.mapNotNull { edge ->
            val neighborId = if (edge.source == nodeId) edge.target else edge.source
            val neighbor = graphService.getNodeById(neighborId)
            if (neighbor != null && (tagFilters.isEmpty() || tagFilters.intersect(neighbor.tags).isNotEmpty())) {
                neighbor
            } else null
        }
    }

    /**
     * Retrieve all paths from a node within N depth and filter by context.
     */
    fun findPaths(nodeId: String, depth: Int = 2, tagContext: Set<String> = emptySet()): List<List<GraphNode>> {
        val visited = mutableSetOf<String>()
        val results = mutableListOf<List<GraphNode>>()

        fun dfs(currentId: String, path: List<GraphNode>) {
            if (path.size > depth) return
            visited.add(currentId)

            val node = graphService.getNodeById(currentId) ?: return
            if (tagContext.isEmpty() || tagContext.intersect(node.tags).isNotEmpty()) {
                results.add(path + node)
            }

            val neighbors = exploreContext(currentId)
            for (neighbor in neighbors) {
                if (!visited.contains(neighbor.id)) {
                    dfs(neighbor.id, path + node)
                }
            }
        }

        dfs(nodeId, emptyList())
        return results
    }

    fun semanticSearch(query: String): List<GraphNode> {
        val document = pipeline.process(query)
        val entities = document.sentences().flatMap { it.mentions() }
        val matchingNodes = entities.mapNotNull { entity ->
            graphService.getAllNodes().find { node ->
                node.label.equals(entity.text(), ignoreCase = true)
            }
        }

        val exploredNodes = mutableSetOf<GraphNode>()
        for (sentence in document.sentences()) {
            val dependencyParse = sentence.dependencyParse()
            dependencyParse.edgeList().forEach { edge ->
                val sourceNode = graphService.getNodeByLabel(edge.source().word())
                val targetNode = graphService.getNodeByLabel(edge.target().word())

                if (sourceNode != null && targetNode != null) {
                    val relationshipType = edge.relation().toString()
                    val newEdge = GraphEdge(
                        source = sourceNode.id,
                        target = targetNode.id,
                        type = relationshipType,
                        weight = 1.0
                    )
                    graphService.addEdge(newEdge)
                    exploredNodes.add(sourceNode)
                    exploredNodes.add(targetNode)
                }
            }
        }

        return (matchingNodes + exploredNodes).distinct()
    }
}