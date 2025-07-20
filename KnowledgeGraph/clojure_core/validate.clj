;; clojure_core/validate.clj
(ns clojure-core.validate)

(defn check-node [node]
  (and (contains? node :id)
       (contains? node :type)))

(defn valid-graph? [graph]
  (every? check-node (:nodes graph)))