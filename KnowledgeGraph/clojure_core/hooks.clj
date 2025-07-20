;; clojure_core/hooks.clj
(ns clojure-core.hooks)

(defonce hooks (atom []))

(defn register-hook [f]
  (swap! hooks conj f))

(defn run-hooks [graph]
  (reduce (fn [g h] (h g)) graph @hooks))