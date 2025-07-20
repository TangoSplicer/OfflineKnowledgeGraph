package com.knowledgegraph.app

import com.knowledgegraph.app.bridge.ClojureBridge
import com.knowledgegraph.app.bridge.LispBridge
import com.knowledgegraph.app.bridge.MercuryBridge
import com.knowledgegraph.app.model.GraphState
import com.knowledgegraph.app.services.BridgeRouter
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class BridgeRouterTest {

    @Test
    fun testEvaluateClojure() = runBlocking {
        val input = """{"nodes":[],"edges":[]}"""
        val result = BridgeRouter.evaluateClojure(input)
        assertNotNull(result)
    }

    @Test
    fun testEvaluateLisp() = runBlocking {
        val rule = "(dummy-rule)"
        val result = BridgeRouter.evaluateLisp(rule)
        assertTrue(result.isNotEmpty())
    }

    @Test
    fun testRunMercury() = runBlocking {
        val graph = GraphState()
        val output = BridgeRouter.runMercury(graph)
        assertTrue(output.contains(":-") || output.contains("edge"))
    }
}