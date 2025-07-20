(ns knowledge.plugins.reviewer
  (:require [knowledge.plugin-api :as api]))

(defn review-rankings [graph-state context]
  (let [ratings (map (fn [n]
                       {:id (:id n)
                        :label (:label n)
                        :score (rand-int 10)})
                     (:nodes graph-state))]
    {:review-ratings ratings}))

(api/register-plugin!
  :reviewer
  review-rankings
  {:label "Relevance Reviewer"
   :trigger (fn [ctx] true)})