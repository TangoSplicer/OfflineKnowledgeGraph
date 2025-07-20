;; clojure_core.persist.load.clj
(ns clojure-core.persist.load
  (:require [clojure.data.json :as json]
            [clojure.java.io :as io]))

(defn load-from-file [path]
  (with-open [r (io/reader path)]
    (json/read-str (slurp r) :key-fn keyword)))