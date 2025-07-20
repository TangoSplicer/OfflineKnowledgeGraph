package services

import android.content.Context
import model.PluginModel
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class PluginRegistry(private val context: Context) {

    private val pluginDir = File(context.filesDir, "plugins")

    fun listAvailablePlugins(): List<PluginModel> {
        if (!pluginDir.exists()) pluginDir.mkdirs()

        return pluginDir.listFiles()
            ?.filter { it.extension == "json" }
            ?.mapNotNull { file ->
                try {
                    val json = JSONObject(file.readText())
                    PluginModel(
                        id = json.getString("id"),
                        name = json.getString("name"),
                        description = json.getString("description"),
                        author = json.getString("author"),
                        version = json.getString("version"),
                        entryPoint = json.getString("entryPoint"),
                        tags = json.getJSONArray("tags").toList().map { it.toString() },
                        enabled = json.optBoolean("enabled", false)
                    )
                } catch (e: Exception) {
                    null
                }
            } ?: emptyList()
    }

    fun updatePluginStatus(id: String, enabled: Boolean) {
        val pluginFile = pluginDir.listFiles()?.find { it.nameWithoutExtension == id }
        pluginFile?.let {
            val json = JSONObject(it.readText())
            json.put("enabled", enabled)
            it.writeText(json.toString(2))
        }
    }
}

private fun JSONArray.toList(): List<Any> =
    (0 until this.length()).map { this.get(it) }