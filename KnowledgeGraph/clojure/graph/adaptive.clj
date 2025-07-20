(ns clojure.graph.adaptive
  (:require [clojure.string :as str]
            [clojure.graph.entities :as entities]
            [clojure.graph.mutation :as mutation]
            [clojure.graph.search :as search]))

(defn auto-link-image
  "Finds existing nodes with tag/title/keyword similarity to image attributes and links them."
  [graph image-node]
  (let [keywords (get-in image-node [:attrs :tags])
        all-nodes (vals (:nodes graph))
        matches (filter #(some (fn [kw]
                                 (and kw
                                      (or (str/includes? (str (:label %)) kw)
                                          (some #(str/includes? (str %) kw)
                                                (vals (:attrs %)))))
                               keywords)
                        all-nodes)
        edges (for [match matches]
                {:from (:id image-node)
                 :to (:id match)
                 :type :related})]
    (reduce mutation/add-edge graph edges)))