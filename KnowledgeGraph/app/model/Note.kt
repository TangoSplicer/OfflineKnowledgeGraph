package com.knowledgegraph.app.model

data class Note(
    val id: String,
    val title: String,
    val content: String,
    val timestamp: Long,
    val tags: List<String> = emptyList(),
    val imagePaths: List<String> = emptyList()
)