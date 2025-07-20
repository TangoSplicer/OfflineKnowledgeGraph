package com.knowledgegraph.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import java.time.LocalDate

@Composable
fun GraphFilterPanel(
    currentFilterDate: LocalDate,
    onDateChange: (LocalDate) -> Unit,
    onReset: () -> Unit
) {
    Column(modifier = Modifier
        .fillMaxWidth()
        .padding(12.dp)) {
        Text("Graph Time Filter", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Show entries before: ${currentFilterDate}")
            Spacer(modifier = Modifier.width(12.dp))
            Button(onClick = {
                val newDate = currentFilterDate.minusDays(30)
                onDateChange(newDate)
            }) {
                Text("-30d")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = {
                val newDate = currentFilterDate.plusDays(30)
                onDateChange(newDate)
            }) {
                Text("+30d")
            }
            Spacer(modifier = Modifier.width(8.dp))
            TextButton(onClick = onReset) {
                Text("Reset")
            }
        }
    }
}