;; clojure_core/core.clj
(ns clojure-core.core
  (:require [clojure-core.graph :as graph]
            [clojure-core.transform :as transform]
            [clojure-core.snapshot :as snapshot]
            [clojure-core.plugin.registry :as plugins]
            [clojure-core.metrics :as metrics]
            [clojure-core.persist :as persist]
            [clojure-core.search :as search]
            [clojure-core.state :as state]
            [clojure-core.validate :as validate]
            [clojure-core.sign :as sign]
            [clojure-core.hooks :as hooks]
            [clojure.data.json :as json]))

(defonce state (atom {:graph (graph/empty-graph)
                      :snapshots []
                      :metrics {}
                      :provenance []}))

(defn update-graph [json-input]
  (let [payload (json/read-str json-input :key-fn keyword)
        updated (-> @state
                    :graph
                    (transform/apply-transforms payload)
                    plugins/apply-plugins
                    hooks/run-hooks)]
    (swap! state assoc :graph updated)
    (swap! state update :snapshots conj (snapshot/take-snapshot updated))
    (swap! state assoc :metrics (metrics/collect updated))
    (swap! state update :provenance conj (sign/sign-graph updated))
    (json/write-str updated)))