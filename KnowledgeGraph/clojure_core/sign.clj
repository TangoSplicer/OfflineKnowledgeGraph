;; clojure_core/sign.clj
(ns clojure-core.sign
  (:require [clojure.core.hash :as hash]))

(defn sign-graph [graph]
  {:signed-hash (hash/fnv graph)
   :timestamp (System/currentTimeMillis)})