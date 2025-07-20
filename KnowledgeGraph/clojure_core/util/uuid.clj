;; clojure_core/util/uuid.clj
(ns clojure-core.util.uuid
  (:import [java.util UUID]))

(defn gen-id [] (str (UUID/randomUUID)))