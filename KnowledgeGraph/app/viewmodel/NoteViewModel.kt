package com.knowledgegraph.app.viewmodel

import androidx.lifecycle.ViewModel
import com.knowledgegraph.app.model.Note

class NoteViewModel : ViewModel() {

    var selectedNote: Note? = null
        private set

    var associatedImages: List<String> = emptyList()
        private set

    fun loadNote(note: Note) {
        selectedNote = note
        associatedImages = note.imagePaths
    }

    fun onImageTapped(path: String) {
        // Could launch graph overlay or trigger graph preview logic
        println("Tapped image path: $path")
    }
}