package com.knowledgegraph.app.viewmodel

import android.content.Context
import android.view.View
import androidx.lifecycle.ViewModel
import com.knowledgegraph.app.model.GraphEdge
import com.knowledgegraph.app.model.GraphNode
import com.knowledgegraph.app.services.GraphExporter
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File

class ExportViewModel : ViewModel() {

    private val _exportedFile = MutableStateFlow<File?>(null)
    val exportedFile = _exportedFile.asStateFlow()

    fun exportAsJSON(context: Context, nodes: List<GraphNode>, edges: List<GraphEdge>) {
        CoroutineScope(Dispatchers.IO).launch {
            val result = GraphExporter.exportGraphAsJSON(context, nodes, edges)
            _exportedFile.update { result }
        }
    }

    fun exportAsPNG(view: View, context: Context) {
        CoroutineScope(Dispatchers.IO).launch {
            val result = GraphExporter.exportGraphAsPNG(view, context)
            _exportedFile.update { result }
        }
    }

    fun clearExportedFile() {
        _exportedFile.value = null
    }
}