(ns clojure-core.relations)

(defn build-relation-index [graph]
  (group-by :fromId (:edges graph)))