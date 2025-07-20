package com.knowledgegraph.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.viewmodel.GraphViewModel

@Composable
fun RelationshipEditorDialog(
    graphViewModel: GraphViewModel,
    onDismiss: () -> Unit
) {
    var sourceNodeId by remember { mutableStateOf("") }
    var targetNodeId by remember { mutableStateOf("") }
    var relationshipType by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Relationship") },
        text = {
            Column {
                OutlinedTextField(
                    value = sourceNodeId,
                    onValueChange = { sourceNodeId = it },
                    label = { Text("Source Node ID") }
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = targetNodeId,
                    onValueChange = { targetNodeId = it },
                    label = { Text("Target Node ID") }
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = relationshipType,
                    onValueChange = { relationshipType = it },
                    label = { Text("Relationship Type") }
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    graphViewModel.createRelationship(sourceNodeId, targetNodeId, relationshipType)
                    onDismiss()
                }
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            Button(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
