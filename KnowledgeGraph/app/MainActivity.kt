package com.knowledgegraph.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.*
import androidx.lifecycle.lifecycleScope
import com.knowledgegraph.app.ui.screens.*
import com.knowledgegraph.app.ui.theme.AppTheme
import com.knowledgegraph.app.viewmodel.GraphViewModel
import com.knowledgegraph.app.viewmodel.SecurityViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val graphViewModel: GraphViewModel by viewModels()
    private val securityViewModel: SecurityViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Start auto-lock checker loop
        lifecycleScope.launch {
            while (true) {
                delay(10_000L)
                securityViewModel.checkAutoLock()
            }
        }

        setContent {
            AppTheme {
                val isLocked by securityViewModel.isLocked.collectAsState()

                if (isLocked) {
                    BiometricLockScreen(
                        securityViewModel = securityViewModel,
                        activity = this@MainActivity
                    )
                } else {
                    MainScreen(
                        viewModel = graphViewModel,
                        onUserInteraction = { securityViewModel.resetSessionTimer() }
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        securityViewModel.checkAutoLock()
    }

    override fun onUserInteraction() {
        super.onUserInteraction()
        securityViewModel.resetSessionTimer()
    }
}