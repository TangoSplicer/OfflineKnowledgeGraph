package com.knowledgegraph.app.bridge

external object ClojureBridge {
    @JvmStatic external fun updateGraph(payload: String): String
    @JvmStatic external fun getClojureVersion(): String
    @JvmStatic external fun getPluginSuggestions(payload: String): String
    @JvmStatic external fun togglePlugin(pluginId: String): String
    @JvmStatic external fun searchGraph(payload: String): String

    fun safeUpdateGraph(payload: String): String = try {
        updateGraph(payload)
    } catch (e: UnsatisfiedLinkError) {
        "{\"error\":\"Clojure bridge not available. Please check the installation.\",\"details\":\"${e.message}\"}"
    }

    fun safeGetPluginSuggestions(payload: String): String = try {
        getPluginSuggestions(payload)
    } catch (e: UnsatisfiedLinkError) {
        "[{\"plugin-id\":\"error\",\"label\":\"Error\",\"result\":{\"error\":\"Bridge error\",\"details\":\"${e.message}\"}}]"
    }

    fun safeTogglePlugin(pluginId: String): String = try {
        togglePlugin(pluginId)
    } catch (e: UnsatisfiedLinkError) {
        "{\"error\":\"Bridge error\",\"details\":\"${e.message}\"}"
    }

    fun safeSearchGraph(query: String, graphJson: String): String = try {
        val edn = """{:graph "${graphJson.replace("\"", "\\\"")}", :query "$query"}"""
        searchGraph(edn)
    } catch (e: UnsatisfiedLinkError) {
        "[{\"error\":\"Bridge error\",\"details\":\"${e.message}\"}]"
    }
}