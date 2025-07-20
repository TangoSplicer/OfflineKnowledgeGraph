;; clojure_core/lang/dsl.clj
(ns clojure-core.lang.dsl
  (:require [clojure.edn :as edn]
            [clojure-core.rules.engine :as engine]))

(defn load-rules-from-edn [path]
  (->> (slurp path)
       edn/read-string
       (map engine/register-rule!)))