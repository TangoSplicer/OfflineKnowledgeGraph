package plugin

import model.PluginModel

object PluginCatalog {

    private val builtInPlugins = listOf(
        PluginModel(
            id = "reason.summarizer",
            name = "Reason Trace Summarizer",
            description = "Summarizes long reasoning chains into readable narratives.",
            author = "System",
            version = "1.0.0",
            entryPoint = "clojure.plugin.reason.summarizer",
            tags = listOf("inference", "summarize"),
            enabled = false
        ),
        PluginModel(
            id = "graph.heatmap",
            name = "Graph Activity Heatmap",
            description = "Displays frequency of knowledge node interaction.",
            author = "System",
            version = "1.0.0",
            entryPoint = "clojure.plugin.graph.heatmap",
            tags = listOf("graph", "metrics"),
            enabled = false
        )
    )

    fun listDefaultPlugins(): List<PluginModel> = builtInPlugins
}