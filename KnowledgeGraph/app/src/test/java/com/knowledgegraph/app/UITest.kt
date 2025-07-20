package com.knowledgegraph.app

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.knowledgegraph.app.MainActivity
import org.junit.Rule
import org.junit.Test

class UITest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun testAddNodeFABWorks() {
        composeTestRule.onNodeWithContentDescription("Add Node").performClick()
        // Canvas renders at least one label
        composeTestRule.onNodeWithText("Node", substring = true).assertExists()
    }

    @Test
    fun testTopBarButtonsVisible() {
        composeTestRule.onNodeWithContentDescription("Run Reasoning").assertExists()
        composeTestRule.onNodeWithContentDescription("Export Graph").assertExists()
        composeTestRule.onNodeWithContentDescription("Toggle Mode").assertExists()
    }
}