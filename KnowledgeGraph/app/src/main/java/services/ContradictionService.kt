package services

import com.knowledgegraph.app.services.GraphService
import model.ContradictionExplanation

class ContradictionService(private val graphService: GraphService) {
    fun getContradictions(): List<ContradictionExplanation> {
        return listOf(
            ContradictionExplanation(
                conflictingFact = "John lives in London",
                cause = "Another entry states John lives in Tokyo",
                resolutionHint = "Confirm John’s current location and mark one entry as outdated"
            ),
            ContradictionExplanation(
                conflictingFact = "Event Alpha occurred in 2021",
                cause = "Linked node says Event Alpha launched in 2023",
                resolutionHint = "Check event logs or correct the timeline reference"
            )
        )
    }

    fun resolveContradiction(explanation: ContradictionExplanation, resolution: String) {
        val conflictingNodes = graphService.getAllNodes().filter {
            it.label == explanation.conflictingFact || it.label == explanation.cause
        }

        if (conflictingNodes.size == 2) {
            val nodeA = conflictingNodes[0]
            val nodeB = conflictingNodes[1]
            val correctNode = if (resolution == "A") nodeA else nodeB
            val incorrectNode = if (resolution == "A") nodeB else nodeA

            graphService.addEdge(
                com.knowledgegraph.app.model.GraphEdge(
                    source = correctNode.id,
                    target = incorrectNode.id,
                    type = "resolved_contradiction",
                    properties = mapOf("correct_node" to correctNode.id)
                )
            )
        }
    }
}