// android/src/main/jni/bridge_init.cpp
#include <jni.h>
#include <string>

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

extern "C"
JNIEXPORT jstring JNICALL
Java_com_knowledgegraph_app_bridge_ClojureBridge_getPluginSuggestions(JNIEnv* env, jobject, jstring json) {
    const char* inputChars = env->GetStringUTFChars(json, 0);
    std::string result;
    try {
        result = clojure_call_get_plugin_suggestions(inputChars);
    } catch (...) {
        result = "{\"error\":\"Clojure call failed\"}";
    }
    env->ReleaseStringUTFChars(json, inputChars);
    return env->NewStringUTF(result.c_str());
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_knowledgegraph_app_bridge_ClojureBridge_togglePlugin(JNIEnv* env, jobject, jstring pluginId) {
    const char* idChars = env->GetStringUTFChars(pluginId, 0);
    std::string result;
    try {
        result = clojure_call_toggle_plugin(idChars);
    } catch (...) {
        result = "{\"error\":\"Clojure call failed\"}";
    }
    env->ReleaseStringUTFChars(pluginId, idChars);
    return env->NewStringUTF(result.c_str());
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_knowledgegraph_app_bridge_ClojureBridge_searchGraph(JNIEnv* env, jobject, jstring json) {
    const char* inputChars = env->GetStringUTFChars(json, 0);
    std_string result;
    try {
        result = clojure_call_run_semantic_search(inputChars);
    } catch (...) {
        result = "{\"error\":\"Clojure call failed\"}";
    }
    env->ReleaseStringUTFChars(json, inputChars);
    return env->NewStringUTF(result.c_str());
}