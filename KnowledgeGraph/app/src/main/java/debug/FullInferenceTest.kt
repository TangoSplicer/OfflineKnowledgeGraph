package debug

import bridge.MercuryBridge
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import runtime.lisp_bridge.runLispInference
import java.io.File

data class Fact(val subject: String, val predicate: String, val obj: String)

fun toJsonFact(f: Fact): JSONObject {
    return JSONObject().apply {
        put("subject", f.subject)
        put("predicate", f.predicate)
        put("object", f.obj)
    }
}

fun runFullInferenceTest() = runBlocking {
    val baseFacts = listOf(
        Fact("alice", "works-on", "project-alpha"),
        Fact("project-alpha", "uses", "technology-y")
    )

    println("🔍 Base Facts:")
    baseFacts.forEach { println(" - ${it.subject} --[${it.predicate}]--> ${it.obj}") }

    // --- Step 1: Lisp Inference ---
    val lispResponse = runLispInference("infer", baseFacts.map { toJsonFact(it) })
    println("\n🧠 Lisp Inferred:")
    if (lispResponse is List<*>) {
        lispResponse.forEach { println(" - $it") }
    } else {
        println("❌ Lisp inference failed: $lispResponse")
    }

    // --- Step 2: Mercury Inference ---
    val mercuryResult = MercuryBridge.inferFrom(baseFacts)
    println("\n🧪 Mercury Inferred:")
    mercuryResult.inferred.forEach {
        println(" + ${it.subject} --[${it.predicate}]--> ${it.obj}")
    }

    println("\n⚠️ Mercury Conflicts:")
    mercuryResult.conflicts.forEach {
        println(" ! ${it.subject} --[${it.predicate}]--> ${it.obj}")
    }
}