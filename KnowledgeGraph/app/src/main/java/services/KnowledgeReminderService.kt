package services

import model.KnowledgeNode
import java.time.LocalDate

class KnowledgeReminderService {
    fun getForgottenNodes(): List<KnowledgeNode> {
        return listOf(
            KnowledgeNode(
                title = "Ketogenic Diet",
                lastAccessed = LocalDate.of(2023, 4, 12),
                contextPreview = "Details the metabolic switch in low-carb states"
            ),
            KnowledgeNode(
                title = "Maya Civilization",
                lastAccessed = LocalDate.of(2022, 9, 3),
                contextPreview = "Notes from historical texts and archaeological evidence"
            )
        )
    }
}