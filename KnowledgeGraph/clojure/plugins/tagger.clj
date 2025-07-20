(ns knowledge.plugins.tagger
  (:require [knowledge.plugin-api :as api]))

(defn suggest-tags [graph-state context]
  (let [tagged (filter #(contains? (:meta %) :tags) (:nodes graph-state))
        tag-freq (->> tagged
                      (mapcat #(get-in % [:meta :tags]))
                      frequencies)
        top-tags (take 5 (sort-by val > tag-freq))]
    {:suggested-tags (map first top-tags)}))

(api/register-plugin!
  :tagger
  suggest-tags
  {:label "Tag Propagation"
   :trigger (fn [ctx] true)})