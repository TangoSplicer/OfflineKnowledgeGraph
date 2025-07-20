package com.knowledgegraph.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.viewmodel.ImportViewModel
import com.knowledgegraph.app.viewmodel.GraphViewModel

@Composable
fun NoteImportScreen(
    importViewModel: ImportViewModel,
    graphViewModel: GraphViewModel
) {
    val context = LocalContext.current
    val importedNote by importViewModel.importedNote.collectAsState()

    val filePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
        onResult = { uri: Uri? ->
            uri?.let { importViewModel.importFile(context, it) }
        }
    )

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Import Markdown or PDF") })
        },
        floatingActionButton = {
            if (importedNote != null) {
                FloatingActionButton(onClick = {
                    val note = importedNote!!
                    graphViewModel.submitVoiceInput(note.content)
                    importViewModel.clear()
                }) {
                    Text("Add")
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize()
        ) {
            Button(onClick = { filePicker.launch(arrayOf("application/pdf", "text/plain", "text/markdown")) }) {
                Text("Select File")
            }

            Spacer(modifier = Modifier.height(16.dp))

            importedNote?.let { note ->
                Text("File: ${note.title}", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    note.content.take(2000),
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    style = MaterialTheme.typography.bodySmall
                )
            } ?: Text("No file selected", style = MaterialTheme.typography.bodyMedium)
        }
    }
}