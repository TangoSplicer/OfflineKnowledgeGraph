package com.knowledgegraph.app.services

import android.content.Context
import com.knowledgegraph.app.model.PluginMetadata
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

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

    fun installPlugin(context: Context, inputStream: java.io.InputStream) {
        ensurePluginDir(context)
        val dir = File(context.filesDir, PLUGIN_DIR)
        val tempFile = File.createTempFile("plugin", ".zip", dir)

        FileOutputStream(tempFile).use { output ->
            inputStream.copyTo(output)
        }

        // TODO: Unzip and process the plugin metadata
    }

    fun deletePlugin(context: Context, id: String) {
        val dir = File(context.filesDir, PLUGIN_DIR)
        val file = File(dir, "$id.json")
        if (file.exists()) {
            file.delete()
        }
        // TODO: Delete other plugin assets
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