#include <jni.h>
#include <string>
#include <sicl.h>

extern "C" JNIEXPORT jstring JNICALL
Java_com_knowledgegraph_app_bridge_LispBridge_getLispVersion(JNIEnv *env, jobject /* this */) {
    return env->NewStringUTF(sicl_version());
}
extern "C"
JNIEXPORT jstring JNICALL
Java_com_knowledgegraph_app_bridge_LispBridge_nativeRunInferenceWithCorrections(JNIEnv *env,
                                                                               jobject thiz,
                                                                               jstring facts,
                                                                               jstring corrections) {
    // TODO: Implement proper lisp interaction
    const char *native_facts = env->GetStringUTFChars(facts, 0);
    const char *native_corrections = env->GetStringUTFChars(corrections, 0);

    // Placeholder
    std::string result = std::string("Processed: ") + native_facts;

    env->ReleaseStringUTFChars(facts, native_facts);
    env->ReleaseStringUTFChars(corrections, native_corrections);

    return env->NewStringUTF(result.c_str());
}
extern "C"
JNIEXPORT jstring JNICALL
Java_com_knowledgegraph_app_bridge_LispBridge_nativeSafeEvaluateRule(JNIEnv *env, jobject thiz,
                                                                     jstring rule) {
    // TODO: Implement proper lisp interaction
    const char *native_rule = env->GetStringUTFChars(rule, 0);

    // Placeholder
    std::string result = std::string("Evaluated: ") + native_rule;

    env->ReleaseStringUTFChars(rule, native_rule);

    return env->NewStringUTF(result.c_str());
}
