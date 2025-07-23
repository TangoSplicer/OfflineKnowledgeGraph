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

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.drawscope.Stroke

@Composable
fun GraphCanvas(
    nodes: List<GraphNode>,
    edges: List<GraphEdge>,
    selectedNodeId: String?,
    onNodeTap: (String) -> Unit
) {
    val nodePositions = remember { mutableStateMapOf<String, Offset>() }

    // Animate node positions for smooth transitions
    val animatedPositions = nodes.map { node ->
        val animatedX = animateFloatAsState(targetValue = nodePositions[node.id]?.x ?: 0f).value
        val animatedY = animateFloatAsState(targetValue = nodePositions[node.id]?.y ?: 0f).value
        node.id to Offset(animatedX, animatedY)
    }.toMap()

    Box(modifier = Modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Draw edges
            edges.forEach { edge ->
                val sourcePos = animatedPositions[edge.from]
                val targetPos = animatedPositions[edge.to]
                if (sourcePos != null && targetPos != null) {
                    drawLine(
                        color = Color.Gray,
                        start = sourcePos,
                        end = targetPos,
                        strokeWidth = 2f
                    )
                }
            }

            // Draw nodes
            nodes.forEach { node ->
                val position = animatedPositions[node.id]
                if (position != null) {
                    drawCircle(
                        color = if (node.id == selectedNodeId) Color.Blue else Color.Red,
                        radius = 20f,
                        center = position,
                        style = if (node.id == selectedNodeId) Stroke(width = 5f) else Stroke(width = 0f)
                    )
                }
            }
        }
    }
}