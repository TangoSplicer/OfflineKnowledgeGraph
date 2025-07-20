(ns knowledge.graph
  (:require [cheshire.core :as json]))

(defrecord Node [id label type meta])
(defrecord Edge [source target label weight])

(defn new-node [id label type meta]
  (->Node id label type meta))

(defn new-edge [source target label weight]
  (->Edge source target label weight))

(defn graph->json [nodes edges]
  (json/generate-string {:nodes nodes :edges edges}))

(defn json->graph [s]
  (let [{:keys [nodes edges]} (json/parse-string s true)]
    {:nodes (map #(map->Node %) nodes)
     :edges (map #(map->Edge %) edges)}))