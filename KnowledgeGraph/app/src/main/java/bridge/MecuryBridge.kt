package bridge

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.InputStreamReader
import java.lang.StringBuilder

data class Fact(
    val subject: String,
    val predicate: String,
    val obj: String
)

data class MercuryResult(
    val inferred: List<Fact>,
    val conflicts: List<Fact>
)

object MercuryBridge {

    private const val mercuryBinary = "mercury_infer_runner" // compiled Mercury plugin binary
    private const val tempInputFile = "mercury_input.json"
    private const val tempOutputFile = "mercury_output.json"

    suspend fun inferFrom(facts: List<Fact>): MercuryResult = withContext(Dispatchers.IO) {
        // Prepare JSON input
        val json = JSONArray()
        facts.forEach {
            json.put(JSONObject().apply {
                put("subject", it.subject)
                put("predicate", it.predicate)
                put("object", it.obj)
            })
        }

        // Write input to file
        val inputFile = File(tempInputFile)
        inputFile.writeText(json.toString())

        // Execute Mercury engine (assumes binary reads from mercury_input.json and writes to mercury_output.json)
        val process = ProcessBuilder("./$mercuryBinary")
            .directory(File("."))
            .redirectErrorStream(true)
            .start()
        process.waitFor()

        val outputFile = File(tempOutputFile)
        val resultJson = JSONArray(outputFile.readText())

        val inferred = mutableListOf<Fact>()
        val conflicts = mutableListOf<Fact>()

        for (i in 0 until resultJson.length()) {
            val obj = resultJson.getJSONObject(i)
            val fact = Fact(
                obj.getString("subject"),
                obj.getString("predicate"),
                obj.getString("object")
            )
            if (obj.optBoolean("conflict", false)) {
                conflicts.add(fact)
            } else {
                inferred.add(fact)
            }
        }

        MercuryResult(inferred, conflicts)
    }
}