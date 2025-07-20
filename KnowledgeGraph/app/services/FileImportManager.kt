package com.knowledgegraph.app.services

import android.content.Context
import android.net.Uri
import android.util.Log
import java.io.File
import com.knowledgegraph.app.services.BridgeRouter

class FileImportManager(private val context: Context, private val bridgeRouter: BridgeRouter) {

    var enableOCR = true

    fun importFileFromUri(uri: Uri) {
        val path = FileUtils.getPathFromUri(context, uri)
        if (path != null) {
            val file = File(path)
            if (file.exists()) {
                importFile(file)
            } else {
                Log.w("FileImportManager", "File does not exist: $path")
            }
        } else {
            Log.w("FileImportManager", "Failed to resolve file path from URI: $uri")
        }
    }

    private fun isImageFile(file: File): Boolean {
        val ext = file.extension.lowercase()
        return ext in listOf("jpg", "jpeg", "png")
    }

    private fun isTextFile(file: File): Boolean {
        val ext = file.extension.lowercase()
        return ext in listOf("txt", "md", "markdown", "pdf")
    }

    fun importFile(file: File) {
        when {
            isImageFile(file) -> {
                Log.d("FileImportManager", "Routing image to Clojure (OCR=$enableOCR): ${file.absolutePath}")
                bridgeRouter.sendToClojure("extract-file-meta", file.absolutePath)
            }

            isTextFile(file) -> {
                Log.d("FileImportManager", "Routing text to Clojure: ${file.absolutePath}")
                bridgeRouter.sendToClojure("extract-file-meta", file.absolutePath)
            }

            else -> {
                Log.w("FileImportManager", "Unsupported file type: ${file.absolutePath}")
            }
        }
    }
}