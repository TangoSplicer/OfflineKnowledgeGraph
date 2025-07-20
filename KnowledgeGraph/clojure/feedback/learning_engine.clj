(ns feedback.learning-engine
  (:require [graph.core :as g]
            [graph.patterns :as patterns]
            [feedback.weights :as w]
            [metrics.core :as metrics]))

(defn adjust-relationship-weight
  "Increases or decreases the strength of a relationship based on user approval or correction."
  [graph rel-id user-feedback]
  (let [current-weight (g/get-weight graph rel-id)
        adjustment (w/feedback->delta user-feedback)]
    (g/set-weight graph rel-id (+ current-weight adjustment))))

(defn record-feedback
  "Logs user feedback on a suggested relationship and updates graph accordingly."
  [graph rel-id feedback]
  (adjust-relationship-weight graph rel-id feedback)
  (metrics/record-feedback-event rel-id feedback))

(defn auto-promote-patterns
  "Adjusts pattern-matching thresholds based on successful user confirmations."
  [patterns-db feedback-history]
  (reduce
    (fn [db [pattern-id feedback]]
      (if (= feedback :confirmed)
        (update-in db [pattern-id :confidence] inc)
        (update-in db [pattern-id :confidence] dec)))
    patterns-db
    feedback-history))