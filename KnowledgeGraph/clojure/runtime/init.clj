(ns runtime.init
  (:require [graph.core :as core]
            [graph.entities :as entities]
            [graph.adaptive :as adaptive]
            [runtime.registry :as registry]))

(defn preload-graph []
  (core/reset-graph!)
  (doseq [n ["Project Alpha" "AI" "Sleep Pattern" "Morning Routine"]]
    (let [node (core/create-node n {:preloaded true})]
      (adaptive/log-access (:id node)))))

(defn start []
  (println "[INIT] Starting Clojure Knowledge Graph Runtime")
  (preload-graph)
  (registry/register-plugin))