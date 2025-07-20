;; clojure_core/metrics.clj
(ns clojure-core.metrics)

(defn collect [graph]
  {:node-count (count (:nodes graph))
   :edge-count (count (:edges graph))
   :avg-degree (let [total (count (:edges graph))
                     nodes (count (:nodes graph))]
                 (if (zero? nodes) 0 (/ total nodes)))})