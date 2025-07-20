;; clojure_core/index/flat.clj
(ns clojure-core.index.flat)

(defn flat-index [graph]
  (into {}
        (map (fn [n] [(:id n) n]) (:nodes graph))))