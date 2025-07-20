(ns diagnostics.suggestion-justifier
  (:require [graph.core :as g]
            [graph.inference :as infer]))

(defn justify-suggestion
  "Generates a reasoning trace for a suggested connection."
  [graph source target]
  (let [path (infer/find-inference-path graph source target)]
    {:source source
     :target target
     :justification path
     :confidence (infer/estimate-confidence graph path)}))