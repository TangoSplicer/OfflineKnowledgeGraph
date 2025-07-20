package com.knowledgegraph.app.bridge

external object LispBridge {
    @JvmStatic external fun getLispVersion(): String

    fun runInferenceWithCorrections(facts: String, corrections: String): String {
        val payload = """
            (require 'runtime.lisp-bridge)
            (runtime.lisp-bridge/run-lisp-inference-with-corrections "$facts" "$corrections")
        """.trimIndent()
        return ClojureBridge.safeUpdateGraph(payload)
    }

    fun safeEvaluateRule(rule: String): String = try {
        val payload = """
            (require 'runtime.lisp-bridge)
            (runtime.lisp-bridge/evaluate-lisp-rule "$rule")
        """.trimIndent()
        ClojureBridge.safeUpdateGraph(payload)
    } catch (e: UnsatisfiedLinkError) {
        "(error \"Lisp bridge not available\")"
    }
}