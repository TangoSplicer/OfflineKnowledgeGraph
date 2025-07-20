package com.knowledgegraph.app.utils

import java.text.SimpleDateFormat
import java.util.*

object TimeUtils {
    private val formatter = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())

    fun getCurrentTimestamp(): String {
        return formatter.format(Date())
    }
}