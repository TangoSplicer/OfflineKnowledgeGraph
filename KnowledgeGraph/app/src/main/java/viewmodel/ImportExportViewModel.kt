package viewmodel

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import services.FileIOService
import java.text.SimpleDateFormat
import java.util.*

class ImportExportViewModel(app: Application) : AndroidViewModel(app) {

    private val fileIO = FileIOService(app.applicationContext)

    // 🔐 Encryption is now always enabled
    val encryptOnExport: Boolean = true

    var history = mutableStateListOf<String>()
        private set

    fun handleImport(uri: Uri) {
        viewModelScope.launch(Dispatchers.IO) {
            val result = fileIO.importFromUri(uri)
            history.add("Imported: ${result.name} (${timestamp()})")
        }
    }

    fun exportAsJson() {
        viewModelScope.launch(Dispatchers.IO) {
            val file = fileIO.exportAsJson(true)
            history.add("Exported JSON: ${file.name} (${timestamp()})")
        }
    }

    fun exportAsZip() {
        viewModelScope.launch(Dispatchers.IO) {
            val file = fileIO.exportAsZip(true)
            history.add("Exported ZIP: ${file.name} (${timestamp()})")
        }
    }

    fun exportAsDot() {
        viewModelScope.launch(Dispatchers.IO) {
            val file = fileIO.exportAsDot()
            history.add("Exported DOT: ${file.name} (${timestamp()})")
        }
    }

    private fun timestamp(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        return sdf.format(Date())
    }
}