// android/src/main/jni/bridge_init.cpp
#include <jni.h>
#include <string>

static jobject g_plugin_api = nullptr;

extern "C" {
#include "clojure.h" // Assume interop header is in place
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_knowledgegraph_app_bridge_ClojureBridge_updateGraph(JNIEnv* env, jobject, jstring inputJson) {
    const char* inputChars = env->GetStringUTFChars(inputJson, 0);
    std::string input(inputChars);
    env->ReleaseStringUTFChars(inputJson, inputChars);

    std::string result;

    try {
        result = clojure_call_update_graph(input);  // Calls into your clojure.api/update-graph-from-text
    } catch (...) {
        result = "{\"error\":\"Clojure update failed\"}";
    }

    return env->NewStringUTF(result.c_str());
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_knowledgegraph_app_bridge_ClojureBridge_getClojureVersion(JNIEnv* env, jobject) {
    return env->NewStringUTF("Clojure v1.11.3");
}

#include <clojure/lang/RT.h>
#include <clojure/lang/Var.h>
#include <clojure/lang/IFn.h>

extern "C"
JNIEXPORT void JNICALL
Java_com_knowledgegraph_app_bridge_ClojureBridge_setPluginAPI(JNIEnv* env, jobject, jobject pluginAPI) {
    if (g_plugin_api != nullptr) {
        env->DeleteGlobalRef(g_plugin_api);
    }
    g_plugin_api = env->NewGlobalRef(pluginAPI);

    clojure::lang::Var* setPluginApiFn = clojure::lang::RT::var("knowledge.interop", "set-plugin-api!");
    clojure::lang::IFn* invokeFn = dynamic_cast<clojure::lang::IFn*>(setPluginApiFn);

    if (invokeFn) {
        (*invokeFn)(g_plugin_api);
    }
}