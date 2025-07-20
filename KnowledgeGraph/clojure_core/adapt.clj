(ns clojure-core.adapt
  (:require [clojure.set :as set]))

(defn recommend-links [graph]
  (let [types (map :type (:nodes graph))]
    (distinct types)))