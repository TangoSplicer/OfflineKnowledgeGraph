package com.knowledgegraph.app.services

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.knowledgegraph.app.model.NoteType
import com.knowledgegraph.app.model.NoteWrapper
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import java.io.BufferedReader
import java.io.InputStreamReader

object ImportUtils {

    fun readMarkdown(context: Context, uri: Uri): NoteWrapper? {
        return try {
            val input = context.contentResolver.openInputStream(uri)
            val reader = BufferedReader(InputStreamReader(input))
            val text = reader.readText()
            val name = getFileName(context, uri)
            NoteWrapper(
                title = name ?: "Untitled.md",
                content = text,
                type = NoteType.MARKDOWN
            )
        } catch (_: Exception) {
            null
        }
    }

    fun readPdf(context: Context, uri: Uri): NoteWrapper? {
        return try {
            val input = context.contentResolver.openInputStream(uri)
            val document = PDDocument.load(input)
            val stripper = PDFTextStripper()
            val text = stripper.getText(document)
            document.close()
            val name = getFileName(context, uri)
            NoteWrapper(
                title = name ?: "Untitled.pdf",
                content = text,
                type = NoteType.PDF
            )
        } catch (_: Exception) {
            null
        }
    }

    private fun getFileName(context: Context, uri: Uri): String? {
        var name: String? = null
        val cursor = context.contentResolver.query(uri, null, null, null, null)
        if (cursor != null && cursor.moveToFirst()) {
            val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (idx != -1) {
                name = cursor.getString(idx)
            }
            cursor.close()
        }
        return name
    }
}