package model

import java.time.LocalDate

data class KnowledgeNode(
    val title: String,
    val lastAccessed: LocalDate,
    val contextPreview: String
)