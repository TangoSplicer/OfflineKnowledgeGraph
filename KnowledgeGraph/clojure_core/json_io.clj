(ns clojure-core.json-io
  (:require [clojure.data.json :as json]))

(defn encode [data]
  (json/write-str data))

(defn decode [json-str]
  (json/read-str json-str :key-fn keyword))