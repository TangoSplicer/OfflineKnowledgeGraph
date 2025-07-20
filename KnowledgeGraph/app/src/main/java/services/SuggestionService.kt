package services

import model.Suggestion

class SuggestionService {
    fun getSuggestions(): List<Suggestion> {
        return listOf(
            Suggestion(
                source = "Morning Routine",
                target = "Sleep Patterns",
                reason = "User often references sleep in morning notes",
                confidence = 92
            ),
            Suggestion(
                source = "Graph Theory",
                target = "Neural Networks",
                reason = "Both mention connectivity and topological maps",
                confidence = 76
            )
        )
    }
}