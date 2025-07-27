#include <jni.h>
#include <string>

extern "C"
JNIEXPORT jstring JNICALL
Java_com_knowledgegraph_app_bridge_LispBridge_runInferenceWithCorrections(JNIEnv* env, jobject, jstring facts, jstring corrections) {
    jclass clojureBridgeClass = env->FindClass("com/knowledgegraph/app/bridge/ClojureBridge");
    jmethodID mid = env->GetStaticMethodID(clojureBridgeClass, "updateGraph", "(Ljava/lang/String;)Ljava/lang/String;");

    const char* factsChars = env->GetStringUTFChars(facts, 0);
    const char* correctionsChars = env->GetStringUTFChars(corrections, 0);

    std::string lispCode = "(require 'runtime.lisp-bridge) (runtime.lisp-bridge/run-lisp-inference-with-corrections \"" + std::string(factsChars) + "\" \"" + std::string(correctionsChars) + "\")";

    env->ReleaseStringUTFChars(facts, factsChars);
    env->ReleaseStringUTFChars(corrections, correctionsChars);

    jstring lispCodeJString = env->NewStringUTF(lispCode.c_str());

    jstring result = (jstring)env->CallStaticObjectMethod(clojureBridgeClass, mid, lispCodeJString);

    return result;
}
