package services

import model.ContradictionExplanation

class ContradictionService {
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
}