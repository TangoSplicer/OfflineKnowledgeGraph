(ns diagnostics.graph-observer
  (:require [graph.core :as g]))

(defn detect-suspicious-loops
  "Scans the graph for cyclic reasoning loops that may indicate overfitting or feedback distortion."
  [graph]
  (filter #(> (count %) 3)
          (g/find-cycles graph)))

(defn conflicting-nodes
  "Returns pairs of nodes that have contradictory assertions."
  [graph]
  (g/find-contradictions graph))