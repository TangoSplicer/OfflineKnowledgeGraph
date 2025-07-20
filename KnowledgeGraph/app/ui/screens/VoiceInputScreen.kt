package com.knowledgegraph.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.services.VoiceInputManager
import com.knowledgegraph.app.viewmodel.GraphViewModel

@Composable
fun VoiceInputScreen(viewModel: GraphViewModel) {
    val context = LocalContext.current
    var resultText by remember { mutableStateOf<String?>(null) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var listening by remember { mutableStateOf(false) }

    val voiceManager = remember {
        VoiceInputManager(
            context,
            onResult = {
                resultText = it
                viewModel.submitVoiceInput(it)
                listening = false
            },
            onError = {
                errorText = it
                listening = false
            }
        )
    }

    DisposableEffect(Unit) {
        onDispose {
            voiceManager.destroy()
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Text("Voice Dictation", style = MaterialTheme.typography.headlineMedium)

        Spacer(Modifier.height(16.dp))

        if (resultText != null) {
            Text("Recognized:", style = MaterialTheme.typography.labelLarge)
            Text(resultText!!, style = MaterialTheme.typography.bodyLarge)
        }

        if (errorText != null) {
            Text("Error: $errorText", color = MaterialTheme.colorScheme.error)
        }

        Spacer(Modifier.height(24.dp))

        Button(
            onClick = {
                listening = true
                voiceManager.startListening()
                Toast.makeText(context, "Listening…", Toast.LENGTH_SHORT).show()
            },
            enabled = !listening
        ) {
            Text(if (listening) "Listening…" else "Start Voice Input")
        }
    }
}