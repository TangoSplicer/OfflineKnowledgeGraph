package com.knowledgegraph.app.ui.components

import android.content.Context
import android.net.Uri
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.knowledgegraph.app.model.NoteType
import java.io.File

@Composable
fun RichNoteViewer(notePath: String, noteType: NoteType) {
    val context = LocalContext.current
    val noteUri = remember(notePath) { Uri.fromFile(File(notePath)) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        when (noteType) {
            NoteType.MARKDOWN -> {
                val html = remember(notePath) {
                    val md = File(notePath).takeIf { it.exists() }?.readText() ?: "File not found"
                    "<html><body>${md.replace("\n", "<br/>")}</body></html>"
                }
                AndroidView(factory = {
                    WebView(context).apply {
                        webViewClient = WebViewClient()
                        loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
                    }
                }, modifier = Modifier.fillMaxSize())
            }

            NoteType.PDF -> {
                AndroidView(factory = {
                    WebView(context).apply {
                        settings.javaScriptEnabled = true
                        webViewClient = WebViewClient()
                        loadUrl("file:///android_asset/pdfjs/web/viewer.html?file=${noteUri}")
                    }
                }, modifier = Modifier.fillMaxSize())
            }

            else -> {
                Text("Unsupported note type or missing note.")
            }
        }
    }
}