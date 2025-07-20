(ns knowledge.extract
  (:require [clojure.string :as str]
            [knowledge.graph :as g]))

(defprotocol EntityExtractor
  (extract-entities [this text])
  (suggest-links [this graph]))

(defrecord SimpleTextExtractor []
  EntityExtractor
  (extract-entities [_ text]
    (let [words (-> text (str/replace #"[^a-zA-Z0-9 ]" "") (str/split #"\s+"))
          tokens (->> words (filter #(> (count %) 3)) distinct)]
      (map-indexed (fn [i token]
                     (g/new-node (str "n" i) token "concept" {:origin "text"}))
                   tokens)))

  (suggest-links [_ {:keys [nodes]}]
    (let [edges (for [a nodes, b nodes
                      :when (and (not= (:id a) (:id b))
                                 (= (:type a) "concept")
                                 (= (:type b) "concept")
                                 (< (count (clojure.set/intersection
                                             (set (str/split (:label a) #""))
                                             (set (str/split (:label b) #""))))
                                    3))]
                  (g/new-edge (:id a) (:id b) "related" 0.5))]
      edges)))

(def default-extractor (->SimpleTextExtractor))