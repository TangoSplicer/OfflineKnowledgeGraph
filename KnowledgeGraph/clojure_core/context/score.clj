;; clojure_core/context/score.clj
(ns clojure-core.context.score)

(defn confidence-score [node]
  (cond
    (= (:type node) "person") 0.95
    (= (:type node) "location") 0.75
    :else 0.5))