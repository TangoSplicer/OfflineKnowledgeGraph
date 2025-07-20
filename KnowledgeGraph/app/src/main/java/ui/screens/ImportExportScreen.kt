package ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import viewmodel.ImportExportViewModel

@Composable
fun ImportExportScreen(viewModel: ImportExportViewModel = viewModel()) {
    var selectedUri by remember { mutableStateOf<Uri?>(null) }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
        onResult = { uri -> selectedUri = uri?.also { viewModel.handleImport(it) } }
    )

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Import & Export") })
        }
    ) { padding ->
        LazyColumn(
            contentPadding = padding,
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            item {
                Text("Import Knowledge Source", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Button(onClick = {
                    filePickerLauncher.launch(arrayOf("*/*"))
                }) {
                    Text("Choose File to Import")
                }
                Spacer(modifier = Modifier.height(24.dp))
            }

            item {
                Text("Export Knowledge Graph", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))

                Button(onClick = { viewModel.exportAsJson() }) {
                    Text("Export as JSON (Encrypted)")
                }
                Spacer(modifier = Modifier.height(8.dp))

                Button(onClick = { viewModel.exportAsZip() }) {
                    Text("Export as ZIP (Encrypted)")
                }
                Spacer(modifier = Modifier.height(8.dp))

                Button(onClick = { viewModel.exportAsDot() }) {
                    Text("Export as Graphviz (.dot)")
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
                Text("Recent Imports & Exports", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                viewModel.history.forEach {
                    Text("• $it", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}