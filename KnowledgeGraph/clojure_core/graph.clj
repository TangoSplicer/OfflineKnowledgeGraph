;; clojure_core/graph.clj
(ns clojure-core.graph)

(defprotocol GraphOps
  (add-node [graph node])
  (add-edge [graph edge])
  (find-node [graph id])
  (remove-node [graph id]))

(defn empty-graph [] {:nodes [] :edges []})

(extend-type clojure.lang.IPersistentMap
  GraphOps
  (add-node [g node] (update g :nodes conj node))
  (add-edge [g edge] (update g :edges conj edge))
  (find-node [g id] (first (filter #(= (:id %) id) (:nodes g))))
  (remove-node [g id]
    (-> g
        (update :nodes #(remove (fn [n] (= (:id n) id)) %))
        (update :edges #(remove (fn [e] (or (= (:fromId e) id) (= (:toId e) id))) %)))))