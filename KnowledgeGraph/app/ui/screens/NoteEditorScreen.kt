package com.knowledgegraph.app.ui.screens

import android.app.Activity
import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.services.VoiceInputManager
import com.knowledgegraph.app.viewmodel.NoteViewModel

@Composable
fun NoteEditorScreen(viewModel: NoteViewModel) {
    var noteText by remember { mutableStateOf("") }
    val suggestions by viewModel.linkSuggestions.collectAsState()
    val context = LocalContext.current

    val voiceLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data: Intent? = result.data
            val matches = data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            matches?.firstOrNull()?.let {
                noteText = it
                viewModel.generateSuggestions(it)
            }
        }
    }

    Column(modifier = Modifier
        .fillMaxSize()
        .padding(16.dp)
        .verticalScroll(rememberScrollState())) {

        Text("Smart Note Editor", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = noteText,
            onValueChange = {
                noteText = it
                viewModel.generateSuggestions(it)
            },
            label = { Text("Type your note...") },
            modifier = Modifier.fillMaxWidth(),
            trailingIcon = {
                IconButton(onClick = {
                    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                        putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak your note...")
                    }
                    voiceLauncher.launch(intent)
                }) {
                    Icon(Icons.Filled.Mic, contentDescription = "Voice Input")
                }
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (suggestions.isNotEmpty()) {
            Text("Suggested Links:", style = MaterialTheme.typography.labelLarge)
            suggestions.forEach { entity ->
                Text("- ${entity.label} (${entity.type})", color = MaterialTheme.colorScheme.primary)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(onClick = {
            viewModel.saveNote(noteText)
            noteText = ""
        }) {
            Text("Save Note")
        }
    }
}