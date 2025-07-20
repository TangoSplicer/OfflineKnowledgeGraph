package com.knowledgegraph.app.utils

import android.content.Context
import java.io.File

object FileUtils {
    fun exportForgottenNodes(context: Context, nodes: List<Pair<String, String>>): Boolean {
        return try {
            val edn = nodes.joinToString(prefix = "[\n", separator = ",\n", postfix = "\n]") {
                "  {:id \"${it.first}\" :label \"${it.second}\"}"
            }
            val file = File(context.filesDir, "forgotten_nodes.edn")
            file.writeText(edn)
            true
        } catch (e: Exception) {
            false
        }
    }
}