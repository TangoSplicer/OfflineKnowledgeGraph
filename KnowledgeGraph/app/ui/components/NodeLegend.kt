package com.knowledgegraph.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun NodeLegend() {
    Column(
        Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.secondaryContainer)
            .padding(8.dp)
    ) {
        Row(horizontalArrangement = Arrangement.SpaceEvenly) {
            LegendItem(Color(0xFF4ECDC4), "Person")
            LegendItem(Color(0xFFFFC857), "Event")
            LegendItem(Color(0xFF9B5DE5), "Location")
            LegendItem(Color(0xFF48CAE4), "Concept")
            LegendItem(Color.Red, "Contradiction")
        }
    }
}

@Composable
fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(4.dp)) {
        Box(Modifier.size(12.dp).background(color, shape = MaterialTheme.shapes.small))
        Spacer(modifier = Modifier.width(6.dp))
        Text(label, style = MaterialTheme.typography.bodySmall)
    }
}