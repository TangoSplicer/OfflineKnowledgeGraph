(ns clojure-core.index)

(defn index-by-type [graph]
  (group-by :type (:nodes graph)))