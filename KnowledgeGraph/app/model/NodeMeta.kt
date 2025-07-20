package com.knowledgegraph.app.model

data class NodeMeta(
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val confidence: Float = 1.0f,
    val contradiction: Boolean = false
)