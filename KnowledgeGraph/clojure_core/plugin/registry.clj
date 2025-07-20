;; clojure_core/plugin/registry.clj
(ns clojure-core.plugin.registry)

(defonce plugins (atom {}))

(defn register-plugin [k f]
  (swap! plugins assoc k f))

(defn apply-plugins [graph]
  (reduce (fn [g [_ f]] (f g)) graph @plugins))