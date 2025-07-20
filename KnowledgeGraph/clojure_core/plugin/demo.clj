(ns clojure-core.plugin.demo)

(defn timestamp-nodes [graph]
  (update graph :nodes (fn [ns]
                         (map #(assoc % :meta {:ts (System/currentTimeMillis)}) ns))))