package com.knowledgegraph.app.ui.screens

import android.app.Activity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.biometric.BiometricPrompt
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import com.knowledgegraph.app.services.BiometricHelper
import com.knowledgegraph.app.viewmodel.SecurityViewModel

@Composable
fun BiometricLockScreen(
    securityViewModel: SecurityViewModel,
    activity: FragmentActivity
) {
    val context = LocalContext.current
    val biometricHelper = remember { BiometricHelper(context) }

    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        if (biometricHelper.isBiometricAvailable()) {
            biometricHelper.authenticate(
                activity = activity,
                onSuccess = { securityViewModel.unlock() },
                onError = { error = "Authentication failed" }
            )
        } else {
            error = "Biometric not available"
        }
    }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Default.Lock, contentDescription = "Locked", modifier = Modifier.size(64.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("App Locked", style = MaterialTheme.typography.headlineSmall)
            error?.let {
                Spacer(modifier = Modifier.height(12.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
            Spacer(modifier = Modifier.height(24.dp))
            Button(onClick = {
                biometricHelper.authenticate(
                    activity = activity,
                    onSuccess = { securityViewModel.unlock() },
                    onError = { error = "Try again failed" }
                )
            }) {
                Text("Retry Authentication")
            }
        }
    }
}