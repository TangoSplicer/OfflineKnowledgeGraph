package com.knowledgegraph.app

import com.knowledgegraph.app.viewmodel.PluginViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class PluginViewModelTest {

    @Test
    fun testInitialOutput() = runTest {
        val vm = PluginViewModel()
        assertTrue(vm.replOutput.value.contains("Welcome"))
    }

    @Test
    fun testEvaluateListCommand() = runTest {
        val vm = PluginViewModel()
        vm.evaluateCommand(":list")
        assertNotNull(vm.replOutput.value)
    }

    @Test
    fun testUnknownCommand() = runTest {
        val vm = PluginViewModel()
        vm.evaluateCommand(":foo")
        assertTrue(vm.replOutput.value.contains("Unknown"))
    }
}