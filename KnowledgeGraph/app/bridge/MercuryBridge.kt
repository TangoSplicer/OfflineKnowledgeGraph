package com.knowledgegraph.app.bridge

external object MercuryBridge {
    @JvmStatic external fun checkConsistency(graphJson: String): Boolean
    @JvmStatic external fun runInference(graphJson: String): String
    @JvmStatic external fun getMercuryVersion(): String

    fun safeCheckConsistency(graphJson: String): Boolean = try {
        checkConsistency(graphJson)
    } catch (e: UnsatisfiedLinkError) {
        false
    }

    fun safeRunInference(graphJson: String): String = try {
        runInference(graphJson)
    } catch (e: UnsatisfiedLinkError) {
        "inference_error"
    }
}