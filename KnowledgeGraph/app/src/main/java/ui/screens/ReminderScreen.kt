package ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import services.KnowledgeReminderService
import model.KnowledgeNode

@Composable
fun ReminderScreen(reminderService: KnowledgeReminderService = KnowledgeReminderService()) {
    val forgottenNodes by remember { mutableStateOf(reminderService.getForgottenNodes()) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Forgotten Knowledge") })
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            items(forgottenNodes.size) { index ->
                val node = forgottenNodes[index]
                ReminderCard(node)
            }
        }
    }
}

@Composable
fun ReminderCard(node: KnowledgeNode) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = "Topic: ${node.title}", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "Last Accessed: ${node.lastAccessed}", style = MaterialTheme.typography.bodySmall)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "Context: ${node.contextPreview}", style = MaterialTheme.typography.bodySmall)
        }
    }
}