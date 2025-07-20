(ns graph.provenance
  (:require [graph.core :as core]))

(defn tag-origin [node-id source & [timestamp]]
  (core/update-node-properties node-id
    (fn [props]
      (assoc props
             :provenance/source source
             :provenance/timestamp (or timestamp (System/currentTimeMillis))))))

(defn tag-derivation [new-node-id from-node-ids]
  (core/update-node-properties new-node-id
    (fn [props]
      (assoc props :provenance/derived-from from-node-ids))))