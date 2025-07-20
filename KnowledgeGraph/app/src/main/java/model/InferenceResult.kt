package model

data class InferenceResult(
    val conclusion: String,
    val trace: List<String>
)