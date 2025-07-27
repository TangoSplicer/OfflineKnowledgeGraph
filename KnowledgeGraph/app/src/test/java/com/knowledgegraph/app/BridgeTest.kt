package com.knowledgegraph.app

import com.knowledgegraph.app.bridge.ClojureBridge
import com.knowledgegraph.app.bridge.LispBridge
import com.knowledgegraph.app.bridge.MercuryBridge
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class BridgeTest {

    @Test
    fun testClojureBridge() {
        val version = ClojureBridge.getClojureVersion()
        assertNotNull(version)
    }

    @Test
    fun testLispBridge() {
        val version = LispBridge.getLispVersion()
        assertNotNull(version)
    }

    @Test
    fun testMercuryBridge() {
        val version = MercuryBridge.getMercuryVersion()
        assertNotNull(version)
    }
}
