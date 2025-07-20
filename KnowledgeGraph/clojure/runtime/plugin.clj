(ns runtime.plugin
  (:require [graph.core :as core]
            [graph.entities :as entities]
            [graph.mutation :as mutation]
            [graph.adaptive :as adaptive]
            [graph.provenance :as provenance]
            [runtime.bridge :as bridge]))

(def plugin-id "clojure.graph.runtime")

(defn run
  "Entrypoint for plugin calls from Kotlin. Dispatches based on :action in input map."
  [{:keys [action payload]}]
  (case action
    "extract-entities" (entities/inject-entities-into-graph (:text payload))
    "create-node" (apply core/create-node (:args payload))
    "create-edge" (apply core/create-edge (:args payload))
    "remove-node" (mutation/remove-node (:id payload))
    "rank-nodes" (adaptive/rank-important-nodes)
    "tag-origin" (apply provenance/tag-origin (:args payload))
    "tag-derivation" (apply provenance/tag-derivation (:args payload))
    "get-node" (core/get-node (:id payload))
    "all-nodes" (core/all-nodes)
    "all-edges" (core/all-edges)
    (bridge/error "Unknown plugin action" {:action action})))