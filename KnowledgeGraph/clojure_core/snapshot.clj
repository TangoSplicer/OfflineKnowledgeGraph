;; clojure_core/snapshot.clj
(ns clojure-core.snapshot)

(defn take-snapshot [graph]
  {:timestamp (System/currentTimeMillis)
   :graph graph})