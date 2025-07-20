package com.knowledgegraph.app.viewmodel

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import com.knowledgegraph.app.model.NoteWrapper
import com.knowledgegraph.app.services.ImportUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class ImportViewModel : ViewModel() {

    private val _importedNote = MutableStateFlow<NoteWrapper?>(null)
    val importedNote = _importedNote.asStateFlow()

    fun importFile(context: Context, uri: Uri) {
        val type = context.contentResolver.getType(uri) ?: return

        val result = when {
            type.contains("pdf") -> ImportUtils.readPdf(context, uri)
            type.contains("markdown") || type.contains("md") || type.contains("text/plain") -> ImportUtils.readMarkdown(context, uri)
            else -> null
        }

        _importedNote.value = result
    }

    fun clear() {
        _importedNote.value = null
    }
}