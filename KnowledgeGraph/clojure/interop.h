#pragma once
#include <string>

std::string clojure_call_update_graph(const std::string& input);
std::string clojure_call_plugin_suggestions(const std::string& input);
std::string clojure_toggle_plugin(const std::string& pluginId);