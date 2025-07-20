package com.knowledgegraph.app.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.knowledgegraph.app.ui.screens.MainScreen
import com.knowledgegraph.app.ui.screens.NoteEditorScreen
import com.knowledgegraph.app.ui.screens.ContradictionExplanationScreen
import com.knowledgegraph.app.ui.screens.RelationshipEditorScreen
import com.knowledgegraph.app.viewmodel.GraphViewModel
import com.knowledgegraph.app.viewmodel.NoteViewModel
import com.knowledgegraph.app.viewmodel.ReminderViewModel

@Composable
fun AppNavHost(
    navController: NavHostController,
    graphViewModel: GraphViewModel,
    noteViewModel: NoteViewModel,
    reminderViewModel: ReminderViewModel
) {
    NavHost(navController = navController, startDestination = "main") {
        composable("main") {
            MainScreen(
                viewModel = graphViewModel,
                reminderViewModel = reminderViewModel,
                navController = navController
            )
        }
        composable("notes") {
            NoteEditorScreen(viewModel = noteViewModel)
        }
        composable("import") { ImportScreen(graphViewModel = graphViewModel)
        }
        composable("voice") { VoiceNoteScreen(graphViewModel = graphViewModel) 
        }
        composable("import_note") {
    val importViewModel: ImportViewModel = viewModel()
    NoteImportScreen(
        importViewModel = importViewModel,
        graphViewModel = graphViewModel
    )
}
        composable("relationship_editor") {
            RelationshipEditorScreen(graphViewModel = graphViewModel)
        }
        composable("contradictions") {
            ContradictionExplanationScreen(graphServiceProvider = graphViewModel)
        }
    }
}