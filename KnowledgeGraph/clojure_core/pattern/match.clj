;; clojure_core/pattern/match.clj
(ns clojure-core.pattern.match)

(defn match-pattern [pattern graph]
  (filter #(every? (fn [[k v]] (= (get % k) v)) pattern)
          (:nodes graph)))