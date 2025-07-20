(ns runtime.registry)

(defonce ^:private plugin-meta
  {:id "clojure.graph.runtime"
   :label "Clojure Knowledge Graph Runtime"
   :version "0.1.0"
   :author "Offline AI System"
   :description "Provides adaptive knowledge graph mutation, extraction, and ranking logic in Clojure."
   :entrypoint "runtime.plugin/run"
   :language "clojure"
   :tags #{"graph" "reasoning" "runtime"}})

(defonce ^:private registry (atom {}))

(defn register-plugin []
  (swap! registry assoc (:id plugin-meta) plugin-meta))

(defn list-plugins []
  (vals @registry))

(defn get-plugin [id]
  (get @registry id))