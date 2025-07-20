package ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import services.ContradictionService
import model.ContradictionExplanation

@Composable
fun ContradictionExplanationScreen(contradictionService: ContradictionService = ContradictionService()) {
    val explanations by remember { mutableStateOf(contradictionService.getContradictions()) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Contradictions & Explanations") })
        }
    ) { padding ->
        LazyColumn(
            contentPadding = padding,
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            items(explanations.size) { index ->
                val item = explanations[index]
                ContradictionCard(item)
            }
        }
    }
}

@Composable
fun ContradictionCard(item: ContradictionExplanation) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = "Conflict: ${item.conflictingFact}", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(4.dp))
            Text("Cause: ${item.cause}", style = MaterialTheme.typography.bodySmall)
            Spacer(modifier = Modifier.height(4.dp))
            Text("Resolution Suggestion: ${item.resolutionHint}", style = MaterialTheme.typography.bodySmall)
        }
    }
}