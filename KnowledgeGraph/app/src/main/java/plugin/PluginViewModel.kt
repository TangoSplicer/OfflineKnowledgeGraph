package plugin

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import model.PluginModel

class PluginViewModel(app: Application) : AndroidViewModel(app) {

    private val manager = PluginManager(app.applicationContext)

    private var _plugins: List<PluginModel> = emptyList()
    val plugins: List<PluginModel> get() = _plugins

    fun loadPlugins(): List<PluginModel> {
        _plugins = manager.reload()
        return _plugins
    }

    fun toggle(plugin: PluginModel, enabled: Boolean) {
        manager.togglePlugin(plugin.id, enabled)
        _plugins = manager.reload()
    }

    fun launch(plugin: PluginModel): String {
        return manager.launchPlugin(plugin)
    }

    fun getPluginById(id: String): PluginModel? {
        return manager.loadPluginById(id)
    }
}