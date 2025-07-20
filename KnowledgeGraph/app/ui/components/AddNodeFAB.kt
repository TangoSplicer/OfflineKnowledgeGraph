package com.knowledgegraph.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import com.knowledgegraph.app.viewmodel.GraphViewModel

@Composable
fun AddNodeFAB(viewModel: GraphViewModel) {
    FloatingActionButton(
        onClick = {
            viewModel.addRandomNode()
        },
        containerColor = MaterialTheme.colorScheme.primary
    ) {
        Icon(Icons.Filled.Add, contentDescription = "Add Node")
    }
}