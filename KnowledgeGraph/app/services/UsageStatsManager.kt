package com.knowledgegraph.app.services

import android.content.Context
import android.util.Log
import java.io.File
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class UsageStatsManager(private val context: Context) {
    private val logFile = File(context.filesDir, "usage_log.txt")
    private val correctionLogFile = File(context.filesDir, "correction_log.txt")
    private val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")

    fun logEvent(event: String) {
        val timestamp = LocalDateTime.now().format(formatter)
        val entry = "$timestamp - $event\n"
        logFile.appendText(entry)
    }

    fun getLogs(): List<Pair<String, String>> {
        if (!logFile.exists()) return emptyList()
        return logFile.readLines()
            .filter { it.contains(" - ") }
            .map {
                val (time, msg) = it.split(" - ", limit = 2)
                time to msg
            }
    }

    fun clearLogs() {
        if (logFile.exists()) logFile.delete()
    }

    fun logCorrection(original: String, corrected: String) {
        val timestamp = LocalDateTime.now().format(formatter)
        val entry = "$timestamp - original: $original, corrected: $corrected\n"
        correctionLogFile.appendText(entry)
    }

    fun getCorrectionLogs(): List<String> {
        if (!correctionLogFile.exists()) return emptyList()
        return correctionLogFile.readLines()
    }
}