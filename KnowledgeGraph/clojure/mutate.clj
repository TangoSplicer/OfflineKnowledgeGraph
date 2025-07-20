(ns knowledge.mutate
  (:require [knowledge.graph :as g]
            [knowledge.learning :as l]))

(defn add-node [graph node]
  (update graph :nodes conj node))

(defn add-edge [graph edge]
  (update graph :edges conj edge))

(defn merge-nodes [graph new-nodes]
  (reduce add-node graph new-nodes))

(defn merge-edges [graph new-edges]
  (reduce add-edge graph new-edges))

(defn apply-learning-to-edges [edges]
  (map (fn [e]
         (let [w1 (l/get-weight (:source e))
               w2 (l/get-weight (:target e))]
           (assoc e :weight (max (:weight e 0.1) (/ (+ w1 w2) 2.0)))))
       edges))

(defn update-graph [graph-json text extractor]
  (let [graph (g/json->graph graph-json)
        new-nodes (extractor text)
        suggestions (.suggest-links extractor graph)
        boosted (apply-learning-to-edges suggestions)
        updated (-> graph
                    (merge-nodes new-nodes)
                    (merge-edges boosted))]
    (g/graph->json (:nodes updated) (:edges updated))))