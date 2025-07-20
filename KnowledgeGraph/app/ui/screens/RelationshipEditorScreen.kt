package com.knowledgegraph.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.viewmodel.GraphViewModel

@Composable
fun RelationshipEditorScreen(graphViewModel: GraphViewModel) {
    var sourceNodeId by remember { mutableStateOf("") }
    var targetNodeId by remember { mutableStateOf("") }
    var relationshipType by remember { mutableStateOf("") }

    Column(modifier = Modifier
        .fillMaxSize()
        .padding(16.dp)) {
        Text("Create Relationship", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = sourceNodeId,
            onValueChange = { sourceNodeId = it },
            label = { Text("Source Node ID") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = targetNodeId,
            onValueChange = { targetNodeId = it },
            label = { Text("Target Node ID") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = relationshipType,
            onValueChange = { relationshipType = it },
            label = { Text("Relationship Type") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = {
                graphViewModel.createRelationship(sourceNodeId, targetNodeId, relationshipType)
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Create")
        }
    }
}
