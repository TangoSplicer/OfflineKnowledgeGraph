package com.knowledgegraph.app.model

data class PluginMetadata(
    val id: String,
    val name: String,
    val description: String,
    val tags: List<String>,
    val version: String,
    val author: String,
    val compatible: Boolean,
    val entrypoint: String,
    val path: String
)