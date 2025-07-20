(ns graph.core
  (:require [clojure.set :as set]
            [clojure.uuid :as uuid]))

(defrecord Node [id label properties])
(defrecord Edge [id from to type properties])

(defonce ^:private graph-state
  (atom {:nodes {}         ;; id -> Node
         :edges {}         ;; id -> Edge
         :index {:label {} ;; label -> #{node-id}
                 :type  {} ;; edge-type -> #{edge-id}
                 }}))

(defn create-node
  [label & [props]]
  (let [id (str (uuid/v1))
        node (->Node id label (or props {}))]
    (swap! graph-state update-in [:nodes] assoc id node)
    (swap! graph-state update-in [:index :label label] (fnil conj #{}) id)
    node))

(defn create-edge
  [from-id to-id type & [props]]
  (let [id (str (uuid/v1))
        edge (->Edge id from-id to-id type (or props {}))]
    (swap! graph-state update-in [:edges] assoc id edge)
    (swap! graph-state update-in [:index :type type] (fnil conj #{}) id)
    edge))

(defn get-node [id]
  (get-in @graph-state [:nodes id]))

(defn get-edge [id]
  (get-in @graph-state [:edges id]))

(defn all-nodes [] (vals (:nodes @graph-state)))
(defn all-edges [] (vals (:edges @graph-state)))

(defn find-nodes-by-label [label]
  (map get-node (get-in @graph-state [:index :label label])))

(defn find-edges-by-type [type]
  (map get-edge (get-in @graph-state [:index :type type])))

(defn reset-graph! []
  (reset! graph-state {:nodes {} :edges {} :index {:label {} :type {}}}))