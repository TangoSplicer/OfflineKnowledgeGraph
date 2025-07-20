package com.knowledgegraph.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.model.GraphNode

@Composable
fun ReminderCard(node: GraphNode, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text("Forgotten Node", style = MaterialTheme.typography.titleSmall, color = Color.DarkGray)
            Text(node.label, style = MaterialTheme.typography.titleLarge)
            Text("Type: ${node.type}", style = MaterialTheme.typography.bodySmall)
        }
    }
}