package com.knowledgegraph.app.viewmodel

import androidx.lifecycle.ViewModel
import com.knowledgegraph.app.model.GraphNode
import com.knowledgegraph.app.services.ReminderEngine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class ReminderViewModel : ViewModel() {

    private val _forgottenNodes = MutableStateFlow<List<GraphNode>>(emptyList())
    val forgottenNodes: StateFlow<List<GraphNode>> = _forgottenNodes

    init {
        _forgottenNodes.value = ReminderEngine.getForgottenNodes()
    }
}