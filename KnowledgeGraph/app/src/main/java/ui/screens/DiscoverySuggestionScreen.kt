package ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import model.Suggestion
import services.SuggestionService

@Composable
fun DiscoverySuggestionsScreen(suggestionService: SuggestionService = SuggestionService()) {
    val suggestions by remember { mutableStateOf(suggestionService.getSuggestions()) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Discover Connections") })
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            items(suggestions.size) { index ->
                val suggestion = suggestions[index]
                SuggestionCard(suggestion)
            }
        }
    }
}

@Composable
fun SuggestionCard(suggestion: Suggestion) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text("Suggested Link:", style = MaterialTheme.typography.titleSmall)
            Text("→ ${suggestion.source} ↔ ${suggestion.target}", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(4.dp))
            Text("Reason: ${suggestion.reason}", style = MaterialTheme.typography.bodySmall)
            if (suggestion.confidence != null) {
                Spacer(modifier = Modifier.height(2.dp))
                Text("Confidence: ${suggestion.confidence}%", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}