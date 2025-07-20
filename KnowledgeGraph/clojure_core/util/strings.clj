(ns clojure-core.util.strings)

(defn normalize-label [label]
  (.toLowerCase (clojure.string/trim label)))