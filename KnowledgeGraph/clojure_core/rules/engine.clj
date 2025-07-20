;; clojure_core/rules/engine.clj
(ns clojure-core.rules.engine)

(defonce rules (atom []))

(defn register-rule! [rule]
  (swap! rules conj rule))

(defn apply-rules [graph]
  (reduce (fn [g r]
            (if ((:when r) g)
              ((:then r) g)
              g))
          graph
          @rules))