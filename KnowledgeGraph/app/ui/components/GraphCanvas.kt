package com.knowledgegraph.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.model.GraphNode
import com.knowledgegraph.app.model.GraphEdge

@Composable
fun GraphCanvas(
    nodes: List<GraphNode>,
    edges: List<GraphEdge>,
    triggerImageId: String? = null
) {
    var overlayVisible by remember { mutableStateOf(triggerImageId != null) }

    Box(modifier = Modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Basic graph rendering logic (omitted for brevity)
        }

        if (overlayVisible && triggerImageId != null) {
            val centerNode = nodes.find { it.id == triggerImageId }
            val connected = edges.filter { it.from == triggerImageId || it.to == triggerImageId }

            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .background(Color(0xFF222222), shape = RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                Column {
                    Text("Graph Insight for ${centerNode?.id}", color = Color.White)
                    connected.forEach {
                        Text("- ${it.type}: ${it.from} ↔ ${it.to}", color = Color.LightGray)
                    }
                }
            }
        }
    }
}