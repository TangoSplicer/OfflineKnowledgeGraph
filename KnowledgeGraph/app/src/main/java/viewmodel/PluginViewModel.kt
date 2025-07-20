package viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import model.PluginModel
import services.PluginManager

class PluginViewModel(app: Application) : AndroidViewModel(app) {
    private val manager = PluginManager(app.applicationContext)

    fun loadPlugins(): List<PluginModel> = manager.getPlugins()

    fun toggle(plugin: PluginModel, enabled: Boolean) {
        manager.togglePlugin(plugin.id, enabled)
    }

    fun launch(plugin: PluginModel): String {
        return manager.launchPlugin(plugin)
    }
}