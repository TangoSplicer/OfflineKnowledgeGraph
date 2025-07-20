package services

import android.content.Context
import model.PluginModel

class PluginManager(private val context: Context) {

    private val registry = PluginRegistry(context)

    fun getPlugins(): List<PluginModel> = registry.listAvailablePlugins()

    fun togglePlugin(id: String, enable: Boolean) {
        registry.updatePluginStatus(id, enable)
    }

    fun launchPlugin(plugin: PluginModel): String {
        // TODO: Connect to Clojure plugin runtime via JNI or file-based trigger
        return "Plugin '${plugin.name}' executed.\n(Result from ${plugin.entryPoint} would display here.)"
    }
}