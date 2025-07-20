package com.knowledgegraph.app.services

import android.content.Context
import com.knowledgegraph.app.model.PluginMetadata
import org.json.JSONObject
import java.io.File

object PluginManager {

    private const val PLUGIN_DIR = "plugins"

    fun listPlugins(context: Context): List<PluginMetadata> {
        val dir = File(context.filesDir, PLUGIN_DIR)
        if (!dir.exists()) return emptyList()

        return dir.listFiles()
            ?.filter { it.name.endsWith(".json") }
            ?.mapNotNull { file ->
                try {
                    val json = JSONObject(file.readText())
                    PluginMetadata.fromJson(json)
                } catch (e: Exception) {
                    null
                }
            }.orEmpty()
    }

    fun togglePlugin(context: Context, id: String, enabled: Boolean) {
        val dir = File(context.filesDir, PLUGIN_DIR)
        val target = File(dir, "$id.json")
        if (!target.exists()) return

        try {
            val json = JSONObject(target.readText())
            json.put("enabled", enabled)
            target.writeText(json.toString(2))
        } catch (_: Exception) { }
    }

    fun ensurePluginDir(context: Context) {
        val dir = File(context.filesDir, PLUGIN_DIR)
        if (!dir.exists()) dir.mkdirs()
    }
}