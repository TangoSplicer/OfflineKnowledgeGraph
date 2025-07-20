;; clojure_core/api.clj
(ns clojure-core.api
  (:require [clojure-core.core :as core]))

(defn handle [json-input]
  (core/update-graph json-input))