package model

data class Suggestion(
    val source: String,
    val target: String,
    val reason: String,
    val confidence: Int? = null
)