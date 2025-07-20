package com.knowledgegraph.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.services.FileImportManager
import com.knowledgegraph.app.viewmodel.GraphViewModel

@Composable
fun ImportScreen(graphViewModel: GraphViewModel) {
    val context = LocalContext.current
    var fileContent by remember { mutableStateOf<String?>(null) }
    var fileName by remember { mutableStateOf<String?>(null) }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            fileName = FileImportManager.getFileName(context, it)
            fileContent = when {
                fileName?.endsWith(".md") == true -> FileImportManager.readMarkdown(context, it)
                fileName?.endsWith(".pdf") == true -> FileImportManager.readPDF(context, it)
                else -> "Unsupported file type"
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Top,
        horizontalAlignment = Alignment.Start
    ) {
        Text("Import Markdown or PDF", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(12.dp))

        Button(onClick = { launcher.launch("*/*") }) {
            Text("Choose File")
        }

        Spacer(modifier = Modifier.height(24.dp))

        fileContent?.let {
            Text("File: ${fileName ?: "Unnamed"}", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(
                value = it.take(1000),
                onValueChange = {},
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                label = { Text("Preview (truncated)") },
                readOnly = true
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = {
                graphViewModel.updateGraphFromText(it)
            }) {
                Text("Import to Knowledge Graph")
            }
        }
    }
}