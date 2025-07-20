;; clojure_core/transform.clj
(ns clojure-core.transform
  (:require [clojure.string :as str]))

(defn apply-transforms [graph payload]
  (let [nodes (:nodes payload)
        edges (:edges payload)]
    (-> graph
        (update :nodes into nodes)
        (update :edges into edges))))