;; clojure_core/search.clj
(ns clojure-core.search)

(defn by-keyword [graph kw]
  (filter #(some (fn [[k v]] (and (string? v) (.contains v kw))) %) (:nodes graph)))

(defn by-id [graph id]
  (some #(when (= (:id %) id) %) (:nodes graph)))