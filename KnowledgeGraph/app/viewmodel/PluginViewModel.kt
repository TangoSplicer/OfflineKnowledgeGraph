package com.knowledgegraph.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.knowledgegraph.app.services.PluginCatalog
import com.knowledgegraph.app.services.PluginManager
import com.knowledgegraph.app.services.PluginRuntimeBridge
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.io.File

class PluginViewModel : ViewModel() {

    private val _replOutput = MutableStateFlow("Welcome to the plugin REPL.")
    val replOutput: StateFlow<String> = _replOutput

    fun evaluateCommand(cmd: String) {
        viewModelScope.launch {
            when {
                cmd.startsWith(":list") -> {
                    val plugins = PluginManager.getPluginFiles()
                    _replOutput.value = plugins.joinToString("\n") { it.name }
                }

                cmd.startsWith(":clear") -> {
                    PluginManager.clearPlugins()
                    _replOutput.value = "All plugin files cleared."
                }

                cmd.startsWith(":load") -> {
                    val filename = cmd.removePrefix(":load").trim()
                    val file = PluginManager.getPluginFiles().find { it.name == filename }
                    if (file != null) {
                        val result = PluginRuntimeBridge.evaluateClojurePlugin(PluginManager.readPlugin(file))
                        _replOutput.value = "Evaluated $filename:\n$result"
                    } else {
                        _replOutput.value = "Plugin not found: $filename"
                    }
                }

                cmd.startsWith(":eval") -> {
                    val code = cmd.removePrefix(":eval").trim()
                    val result = PluginRuntimeBridge.evaluateClojurePlugin(code)
                    _replOutput.value = "Result:\n$result"
                }

                cmd.startsWith(":catalog") -> {
                    val discovered = PluginCatalog.discover()
                    _replOutput.value = discovered.joinToString("\n\n") { meta ->
                        """
                        • ${meta.name} (v${meta.version})
                          ${meta.description}
                          by ${meta.author}
                          tags: ${meta.tags.joinToString(", ")}
                        """.trimIndent()
                    }.ifEmpty { "No plugins with metadata found." }
                }

                else -> {
                    _replOutput.value = """
                        Unknown command.
                        Available:
                        :list      → list plugin files
                        :load NAME → run plugin file
                        :eval CODE → run inline clojure
                        :clear     → delete all plugin files
                        :catalog   → discover plugins with metadata
                    """.trimIndent()
                }
            }
        }
    }
}