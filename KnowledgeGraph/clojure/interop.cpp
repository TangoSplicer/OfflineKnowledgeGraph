std::string clojure_search_graph(const std::string& queryPayload) {
    static bool initialized = false;
    try {
        if (!initialized) {
            clojure::lang::RT::load("knowledge/interop");
            initialized = true;
        }
        auto* fn = clojure::lang::RT::var("knowledge.api", "run-semantic-search");
        auto* invoke = dynamic_cast<clojure::lang::IFn*>(fn);
        if (invoke) {
            auto* arg = new clojure::lang::String(queryPayload);
            auto* result = (*invoke)(arg);
            return result->toString();
        }
    } catch (...) {
        return "{\"error\":\"semantic_search_failed\"}";
    }
    return "{\"error\":\"null_semantic_result\"}";
}