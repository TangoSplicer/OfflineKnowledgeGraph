;; clojure_core/sign/verify.clj
(ns clojure-core.sign.verify
  (:require [clojure.core.hash :as hash]))

(defn verify-signature [signed current]
  (= (:signed-hash signed)
     (hash/fnv current)))