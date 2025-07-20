package com.knowledgegraph.app.services

import com.knowledgegraph.app.bridge.ClojureBridge
import com.knowledgegraph.app.bridge.LispBridge
import com.knowledgegraph.app.bridge.MercuryBridge
import com.knowledgegraph.app.model.GraphState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object BridgeRouter {

    suspend fun evaluateClojure(graphJson: String): String = withContext(Dispatchers.IO) {
        return@withContext ClojureBridge.updateGraph(graphJson)
    }

    suspend fun evaluateLisp(ruleText: String): String = withContext(Dispatchers.IO) {
        return@withContext LispBridge.evaluateRule(ruleText)
    }

    suspend fun runMercury(graph: GraphState): String = withContext(Dispatchers.IO) {
        val factData = GraphService.toFactFile(graph)
        val tempFile = kotlin.io.path.createTempFile("facts_", ".txt")
        tempFile.toFile().writeText(factData)

        val process = ProcessBuilder("./mercury_run", tempFile.toAbsolutePath().toString())
            .redirectErrorStream(true)
            .start()

        val result = process.inputStream.bufferedReader().readText()
        process.waitFor()
        return@withContext result
    }
}