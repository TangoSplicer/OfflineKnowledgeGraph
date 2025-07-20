package com.knowledgegraph.app.model

import java.time.LocalDate

data class GraphNode(
    val id: String,
    val label: String,
    val type: NodeType,
    val attributes: List<NodeAttribute> = emptyList(),
    val meta: NodeMeta = NodeMeta(),
    val contradiction: Boolean = false,
    val notePath: String? = null,     // NEW: local note file path
    val noteType: NoteType? = null    // NEW: Markdown or PDF
)

data class NodeMeta(
    val timestamp: LocalDate? = null,
    val origin: String? = null,
    val tags: List<String> = emptyList()
)

enum class NoteType {
    MARKDOWN, PDF
}