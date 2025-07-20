// android/src/main/jni/interop.cpp
#include "interop.h"
#include <string>
#include <clojure/lang/RT.h>
#include <clojure/lang/Var.h>
#include <iostream>

std::string clojure_call_update_graph(const std::string& input) {
    static bool initialized = false;

    try {
        if (!initialized) {
            clojure::lang::RT::load("knowledge/interop");
            initialized = true;
        }

        clojure::lang::Var* updateFn = clojure::lang::RT::var("knowledge.interop", "update-graph-from-json");
        clojure::lang::IFn* invokeFn = dynamic_cast<clojure::lang::IFn*>(updateFn);

        if (invokeFn) {
            clojure::lang::String* arg = new clojure::lang::String(input);
            clojure::lang::Object* result = (*invokeFn)(arg);
            return result->toString();
        }
    } catch (...) {
        return "{\"error\":\"Clojure interop failed\"}";
    }

    return "{\"error\":\"Interop returned null\"}";
}