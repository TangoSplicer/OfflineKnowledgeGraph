;; clojure_core/state.clj
(ns clojure-core.state)

(defonce store (atom {}))

(defn set-state! [k v] (swap! store assoc k v))
(defn get-state [k] (@store k))
(defn reset-state! [] (reset! store {}))