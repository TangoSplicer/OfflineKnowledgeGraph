package com.knowledgegraph.app.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class SecurityViewModel : ViewModel() {
    private val _isLocked = MutableStateFlow(true)
    val isLocked = _isLocked.asStateFlow()

    private val _lastUnlockTime = MutableStateFlow(System.currentTimeMillis())
    private val _sessionTimeoutMillis = 2 * 60 * 1000L // 2 minutes default

    fun unlock() {
        _isLocked.value = false
        _lastUnlockTime.value = System.currentTimeMillis()
    }

    fun lock() {
        _isLocked.value = true
    }

    fun checkAutoLock() {
        val now = System.currentTimeMillis()
        if (!_isLocked.value && now - _lastUnlockTime.value > _sessionTimeoutMillis) {
            _isLocked.value = true
        }
    }

    fun resetSessionTimer() {
        _lastUnlockTime.value = System.currentTimeMillis()
    }
}