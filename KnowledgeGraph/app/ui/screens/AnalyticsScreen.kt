package com.knowledgegraph.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.knowledgegraph.app.services.UsageStatsManager

@Composable
fun AnalyticsScreen() {
    val context = LocalContext.current
    val statsManager = remember { UsageStatsManager(context) }
    val logs by remember { mutableStateOf(statsManager.getLogs()) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Usage Analytics") })
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text("Recent Activity Log:", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            logs.takeLast(50).reversed().forEach { (time, msg) ->
                Text("• [$time] $msg", style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}