package com.knowledgegraph.app.bridge

external object LispBridge {
    @JvmStatic external fun evaluateRule(rule: String): String
    @JvmStatic external fun getLispVersion(): String

    fun safeEvaluateRule(rule: String): String = try {
        evaluateRule(rule)
    } catch (e: UnsatisfiedLinkError) {
        "(error \"Lisp bridge not available\")"
    }
}