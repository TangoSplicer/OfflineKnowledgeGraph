package com.knowledgegraph.app.ui.screens

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.services.VoiceInputManager
import com.knowledgegraph.app.viewmodel.GraphViewModel
import androidx.compose.runtime.saveable.rememberSaveable

@Composable
fun VoiceNoteScreen(graphViewModel: GraphViewModel) {
    val context = LocalContext.current
    val activity = context as Activity
    var transcript by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(Unit) {
        VoiceInputManager.startVoiceRecognition(activity)
    }

    // Listen to onActivityResult manually
    DisposableEffect(Unit) {
        val callback = object : androidx.activity.result.ActivityResultCallback<Intent> {
            override fun onActivityResult(result: Intent?) {
                val data = result?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                if (!data.isNullOrEmpty()) {
                    transcript = data[0]
                }
            }
        }
        activity.intent?.let {
            callback.onActivityResult(it)
        }
        onDispose { }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Voice Input") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
        ) {
            Text("Spoken Text:", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(
                value = transcript,
                onValueChange = { transcript = it },
                label = { Text("Transcript") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = {
                graphViewModel.updateGraphFromText(transcript)
            }) {
                Text("Insert into Knowledge Graph")
            }
        }
    }
}