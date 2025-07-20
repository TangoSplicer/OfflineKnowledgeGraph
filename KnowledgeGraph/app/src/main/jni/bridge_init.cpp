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