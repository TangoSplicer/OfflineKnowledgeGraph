(ns knowledge.search-engine
  (:require [clojure.string :as str]
            [clojure.set :as set]
            [graph.core :as graph]))

(defn- normalize [s]
  (-> s str/lower-case str/trim))

(defn- tf [term doc]
  (count (filter #(= term %) (str/split doc #"\s+"))))

(defn- idf [term docs]
  (Math/log (/ (count docs)
               (inc (count (filter #(contains? (set (str/split % #"\s+")) term) docs))))))

(defn- tf-idf [term doc docs]
  (* (tf term doc) (idf term docs)))

(defn- score-node [query node docs]
  (let [q-terms (-> query normalize (str/split #"\s+"))
        node-text (str (:label node) " " (pr-str (:properties node)))]
    (reduce + (map #(tf-idf % node-text docs) q-terms))))

(defn semantic-search [query]
  (let [nodes (graph/all-nodes)
        docs (map #(str (:label %) " " (pr-str (:properties %))) nodes)
        matches
        (for [node nodes]
          {:id (:id node)
           :label (:label node)
           :score (score-node query node docs)})]
    (sort-by :score > (filter #(> (:score %) 0) matches))))