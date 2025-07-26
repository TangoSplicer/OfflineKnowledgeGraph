package com.knowledgegraph.app.services

import android.content.Context
import com.knowledgegraph.app.model.GraphState
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

class FileIOService(private val context: Context) {

    private val baseDir = context.filesDir

    fun saveGraph(graphState: GraphState, filename: String): Boolean {
        return try {
            val json = Json.encodeToString(graphState)
            val file = File(baseDir, filename)
            file.writeText(json)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun loadGraph(filename: String): GraphState? {
        return try {
            val file = File(baseDir, filename)
            if (!file.exists()) return null
            val json = file.readText()
            Json.decodeFromString<GraphState>(json)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun exportGraph(graphState: GraphState, format: String, path: String): Boolean {
        // TODO: Implement different export formats (e.g., GraphML, GEXF)
        return saveGraph(graphState, path)
    }

    fun importGraph(path: String): GraphState? {
        // TODO: Implement different import formats
        return loadGraph(path)
    }
}
