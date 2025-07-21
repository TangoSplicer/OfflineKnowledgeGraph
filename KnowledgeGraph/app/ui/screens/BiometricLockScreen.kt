package com.knowledgegraph.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.surface,
                        MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(16.dp)
        ) {
            Icon(
                Icons.Default.Lock,
                contentDescription = "Locked",
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text("App Locked", style = MaterialTheme.typography.headlineMedium)
            error?.let {
                Spacer(modifier = Modifier.height(12.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = {
                    biometricHelper.authenticate(
                        activity = activity,
                        onSuccess = { securityViewModel.unlock() },
                        onError = { error = "Try again failed" }
                    )
                },
                modifier = Modifier.fillMaxWidth(0.8f)
            ) {
                Text("Retry Authentication")
            }
        }
    }
}