package ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import services.InferenceService
import model.InferenceResult

@Composable
fun InferenceScreen(inferenceService: InferenceService = InferenceService()) {
    val inferenceResults by remember { mutableStateOf(inferenceService.fetchInferenceResults()) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Inference Engine Display") })
        }
    ) { padding ->
        LazyColumn(
            contentPadding = padding,
            modifier = Modifier.fillMaxSize().padding(16.dp)
        ) {
            items(inferenceResults.size) { index ->
                val result = inferenceResults[index]
                InferenceResultCard(result)
            }
        }
    }
}

@Composable
fun InferenceResultCard(result: InferenceResult) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = "Conclusion: ${result.conclusion}", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(6.dp))
            Text("Reasoning Path:", style = MaterialTheme.typography.labelMedium)
            result.trace.forEach { step ->
                Text("- $step", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}