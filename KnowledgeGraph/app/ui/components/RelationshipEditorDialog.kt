package com.knowledgegraph.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.viewmodel.GraphViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RelationshipEditorDialog(
    graphViewModel: GraphViewModel,
    onDismiss: () -> Unit
) {
    val nodes = graphViewModel.graphState.collectAsState().value.nodes
    var sourceNode by remember { mutableStateOf<GraphNode?>(null) }
    var targetNode by remember { mutableStateOf<GraphNode?>(null) }
    var relationshipType by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Relationship") },
        text = {
            Column {
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = sourceNode?.label ?: "",
                        onValueChange = { },
                        label = { Text("Source Node") },
                        readOnly = true,
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                        }
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        nodes.forEach { node ->
                            DropdownMenuItem(
                                onClick = {
                                    sourceNode = node
                                    expanded = false
                                }
                            ) {
                                Text(node.label)
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = targetNode?.label ?: "",
                        onValueChange = { },
                        label = { Text("Target Node") },
                        readOnly = true,
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                        }
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        nodes.forEach { node ->
                            DropdownMenuItem(
                                onClick = {
                                    targetNode = node
                                    expanded = false
                                }
                            ) {
                                Text(node.label)
                            }
                        }
                    }
                }
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
                    sourceNode?.let { source ->
                        targetNode?.let { target ->
                            graphViewModel.createRelationship(source.id, target.id, relationshipType)
                            onDismiss()
                        }
                    }
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
