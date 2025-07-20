package model

data class ContradictionExplanation(
    val conflictingFact: String,
    val cause: String,
    val resolutionHint: String
)