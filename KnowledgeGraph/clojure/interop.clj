(ns knowledge.interop
  (:require [knowledge.api :as api])
  (:import (com.knowledgegraph.app.services GraphService)))

(defonce ^:private plugin-api-atom (atom nil))

(defn set-plugin-api! [api]
  (reset! plugin-api-atom api))

(defn get-plugin-api []
  @plugin-api-atom)

(defn update-graph-from-json
  "Entry point for native bridge. Accepts a raw JSON string with both graph and input text."
  [input-json]
  (let [{:keys [graph text]} (clojure.edn/read-string input-json)
        result (api/update-graph-from-text graph text)]
    result))