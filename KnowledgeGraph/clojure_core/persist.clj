(ns clojure-core.persist
  (:require [clojure.java.io :as io]))

(defn save-to-disk [graph path]
  (spit path (pr-str graph)))

(defn load-from-disk [path]
  (read-string (slurp path)))