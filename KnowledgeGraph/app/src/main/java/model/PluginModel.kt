package model

data class PluginModel(
    val id: String,
    val name: String,
    val description: String,
    val author: String,
    val version: String,
    val entryPoint: String,
    val tags: List<String>,
    val enabled: Boolean = false
)