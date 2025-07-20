package com.knowledgegraph.app.services

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

import plugin.PluginAPI

object PluginRuntimeBridge {

import com.knowledgegraph.app.bridge.ClojureBridge
import plugin.PluginAPI

object PluginRuntimeBridge {

    suspend fun evaluateClojurePlugin(code: String, graphService: GraphService): String = withContext(Dispatchers.IO) {
        try {
            val pluginAPI = PluginAPI(graphService)
            ClojureBridge.setPluginAPI(pluginAPI)
            val wrapped = "(do $code)"
            BridgeRouter.evaluateClojure(wrapped)
        } catch (e: Exception) {
            "Plugin Evaluation Error: ${e.localizedMessage}"
        }
    }
}