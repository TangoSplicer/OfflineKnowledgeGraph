package com.knowledgegraph.app.services

import com.knowledgegraph.app.model.GraphNode
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

object ReminderEngine {
    private val accessLog = ConcurrentHashMap<String, Instant>()
    private val nodeStore = listOf(
        GraphNode("1", "AI", "concept"),
        GraphNode("2", "Sleep", "routine"),
        GraphNode("3", "Nutrition", "concept")
    )

    fun logAccess(nodeId: String) {
        accessLog[nodeId] = Instant.now()
    }

    fun getForgottenNodes(): List<GraphNode> {
        val now = Instant.now()
        return nodeStore.filter {
            val lastAccess = accessLog[it.id] ?: Instant.EPOCH
            val daysOld = java.time.Duration.between(lastAccess, now).toDays()
            daysOld > 30
        }
    }
}