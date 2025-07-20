package plugin

import android.content.Context
import model.PluginModel
import org.json.JSONObject
import java.io.File

class PluginManager(private val context: Context) {

    private val registry = PluginRegistry(context)

    fun getPlugins(): List<PluginModel> = registry.listAvailablePlugins()

    fun togglePlugin(id: String, enable: Boolean) {
        registry.updatePluginStatus(id, enable)
    }

    fun launchPlugin(plugin: PluginModel): String {
        // Bridge execution via PluginRuntimeBridge
        return PluginRuntimeBridge.execute(plugin)
    }

    fun loadPluginById(id: String): PluginModel? {
        return getPlugins().find { it.id == id }
    }

    fun reload(): List<PluginModel> = getPlugins()
}