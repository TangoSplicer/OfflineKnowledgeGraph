;; clojure_core/similarity/compare.clj
(ns clojure-core.similarity.compare
  (:require [clojure.string :as str]))

(defn score-similarity [n1 n2]
  (let [keys1 (set (keys n1))
        keys2 (set (keys n2))]
    (/ (count (clojure.set/intersection keys1 keys2))
       (count (clojure.set/union keys1 keys2)))))