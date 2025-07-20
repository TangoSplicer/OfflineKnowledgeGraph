(ns knowledge.search-engine
  (:require [clojure.string :as str]
            [clojure.set :as set]))

(defn- normalize [s]
  (-> s str/lower-case str/trim))

(defn- keyword-match? [query label]
  (let [q (normalize query)
        l (normalize label)]
    (or (.contains l q)
        (.contains q l))))

(defn- tag-match? [query tags]
  (some #(keyword-match? query %) tags))

(defn- attribute-match? [query meta]
  (some #(keyword-match? query (str %)) (vals meta)))

(defn- matches-node? [query node]
  (or (keyword-match? query (:label node))
      (attribute-match? query (:meta node))
      (tag-match? query (get-in node [:meta :tags] []))))

(defn semantic-search [graph query]
  (let [qwords (-> query normalize (str/split #"\s+"))
        nodes (:nodes graph)
        matches
        (for [node nodes
              :when (some #(matches-node? % node) qwords)]
          {:id (:id node)
           :label (:label node)
           :score (count (filter #(matches-node? % node) qwords))})]
    (sort-by :score > matches)))