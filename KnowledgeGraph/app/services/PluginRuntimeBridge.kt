package com.knowledgegraph.app.services

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object PluginRuntimeBridge {

    suspend fun evaluateClojurePlugin(code: String): String = withContext(Dispatchers.IO) {
        try {
            val wrapped = "(do $code)"
            BridgeRouter.evaluateClojure(wrapped)
        } catch (e: Exception) {
            "Plugin Evaluation Error: ${e.localizedMessage}"
        }
    }
}