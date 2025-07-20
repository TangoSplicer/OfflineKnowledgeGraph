;; clojure_core.persist.save.clj
(ns clojure-core.persist.save
  (:require [clojure.java.io :as io]
            [clojure.data.json :as json]))

(defn save-to-file [graph path]
  (with-open [w (io/writer path)]
    (.write w (json/write-str graph))))