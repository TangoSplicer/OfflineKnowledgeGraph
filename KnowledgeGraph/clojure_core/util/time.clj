;; clojure_core/util/time.clj
(ns clojure-core.util.time)

(defn now-ms []
  (System/currentTimeMillis))

(defn format-utc []
  (.format (java.text.SimpleDateFormat. "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
           (java.util.Date.)))