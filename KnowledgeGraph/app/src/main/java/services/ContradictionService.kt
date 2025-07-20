package services

import com.knowledgegraph.app.bridge.MercuryBridge
import com.knowledgegraph.app.model.ContradictionExplanation
import com.knowledgegraph.app.services.GraphServiceProvider
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class ContradictionService(private val graphServiceProvider: GraphServiceProvider) {

    fun getContradictions(): List<ContradictionExplanation> {
        val graphJson = graphServiceProvider.getLatestGraphJson()
        val resultJson = MercuryBridge.safeRunInference(graphJson)

        if (resultJson == "inference_error") {
            return listOf(ContradictionExplanation("Inference Error", "The Mercury inference engine returned an error.", "Check the Mercury logs for more information."))
        }

        val json = Json.parseToJsonElement(resultJson).jsonObject
        val contradictions = json["contradictions"]?.jsonObject?.map { (fact, details) ->
            val cause = details.jsonObject["cause"]?.jsonPrimitive?.content ?: "Unknown cause"
            val resolution = details.jsonObject["resolution"]?.jsonPrimitive?.content ?: "No resolution hint"
            ContradictionExplanation(fact, cause, resolution)
        }

        return contradictions ?: emptyList()
    }
}