package com.knowledgegraph.app

import com.knowledgegraph.app.viewmodel.GraphViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class GraphViewModelTest {

    @Test
    fun testAddRandomNode() {
        val vm = GraphViewModel()
        vm.addRandomNode()
        val nodes = vm.graphState.value.nodes
        assertEquals(1, nodes.size)
    }

    @Test
    fun testExportGraphDoesNotThrow() {
        val vm = GraphViewModel()
        vm.addRandomNode()
        try {
            vm.exportCurrentGraph()
        } catch (e: Exception) {
            fail("Export should not throw")
        }
    }

    @Test
    fun testRunAllEnginesProducesOutput() = runTest {
        val vm = GraphViewModel()
        vm.addRandomNode()
        vm.runAllEngines()
        assertNotNull(vm.inferenceOutput.value)
    }
}