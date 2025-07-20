(ns clojure-core.util.similarity
  (:require [clojure.string :as str]))

(defn jaccard [s1 s2]
  (let [a (set (str/split s1 #""))
        b (set (str/split s2 #""))]
    (/ (count (clojure.set/intersection a b))
       (count (clojure.set/union a b)))))