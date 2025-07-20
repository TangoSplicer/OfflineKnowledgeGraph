(ns graph.mutation
  (:require [graph.core :as core]))

(defn remove-node [node-id]
  (let [edges-to-remove (->> (core/all-edges)
                             (filter #(or (= (:from %) node-id)
                                          (= (:to %) node-id))))]
    (doseq [e edges-to-remove]
      (swap! core/graph-state update :edges dissoc (:id e)))
    (swap! core/graph-state update :nodes dissoc node-id)))

(defn remove-edge [edge-id]
  (swap! core/graph-state update :edges dissoc edge-id))

(defn update-node-properties [node-id update-fn]
  (let [node (core/get-node node-id)]
    (when node
      (swap! core/graph-state update-in [:nodes node-id :properties] update-fn))))

(defn update-edge-properties [edge-id update-fn]
  (let [edge (core/get-edge edge-id)]
    (when edge
      (swap! core/graph-state update-in [:edges edge-id :properties] update-fn))))