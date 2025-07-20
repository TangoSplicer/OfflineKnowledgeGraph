package com.knowledgegraph.app.services

import android.content.Context
import com.knowledgegraph.app.model.PluginMetadata
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

object PluginRegistry {
    private const val REGISTRY_FILE = "plugin_registry.json"

    private var plugins: List<PluginMetadata> = emptyList()

    fun load(context: Context) {
        val file = File(context.filesDir, REGISTRY_FILE)
        if (file.exists()) {
            val content = file.readText()
            plugins = parse(content)
        }
    }

    fun save(context: Context) {
        val json = JSONArray(plugins.map { it.toJson() })
        File(context.filesDir, REGISTRY_FILE).writeText(json.toString(2))
    }

    fun list(): List<PluginMetadata> = plugins

    fun discoverNewPlugins(pluginDir: File): List<PluginMetadata> {
        val discovered = pluginDir.listFiles()?.mapNotNull { file ->
            if (file.extension == "plugin.json") {
                try {
                    val json = JSONObject(file.readText())
                    PluginMetadata(
                        id = json.getString("id"),
                        name = json.getString("name"),
                        description = json.getString("description"),
                        tags = json.optJSONArray("tags")?.let { (0 until it.length()).map(it::getString) } ?: listOf(),
                        version = json.getString("version"),
                        author = json.getString("author"),
                        compatible = json.optBoolean("compatible", true),
                        entrypoint = json.getString("entrypoint"),
                        path = file.absolutePath
                    )
                } catch (_: Exception) {
                    null
                }
            } else null
        } ?: emptyList()

        plugins = plugins + discovered
        return discovered
    }

    private fun parse(json: String): List<PluginMetadata> {
        val array = JSONArray(json)
        return (0 until array.length()).map { i ->
            val obj = array.getJSONObject(i)
            PluginMetadata(
                id = obj.getString("id"),
                name = obj.getString("name"),
                description = obj.getString("description"),
                tags = obj.optJSONArray("tags")?.let { (0 until it.length()).map(it::getString) } ?: listOf(),
                version = obj.getString("version"),
                author = obj.getString("author"),
                compatible = obj.optBoolean("compatible", true),
                entrypoint = obj.getString("entrypoint"),
                path = obj.getString("path")
            )
        }
    }

    private fun PluginMetadata.toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("name", name)
            put("description", description)
            put("tags", JSONArray(tags))
            put("version", version)
            put("author", author)
            put("compatible", compatible)
            put("entrypoint", entrypoint)
            put("path", path)
        }
    }
}