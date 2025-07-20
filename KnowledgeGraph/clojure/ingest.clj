(ns ingest
  (:require [graph.core :as g]
            [graph.entity :as e]
            [graph.relation :as r]
            [clojure.string :as str]))

(defn parse-lines
  "Splits raw input text into lines and returns trimmed non-empty ones."
  [text]
  (->> (str/split-lines text)
       (map str/trim)
       (remove str/blank?)))

(defn detect-entity
  "Naive placeholder for detecting entities (capitalized words)."
  [line]
  (->> (re-seq #"[A-Z][a-z]+(?: [A-Z][a-z]+)?" line)
       (distinct)))

(defn extract-relationships
  "Basic pattern match to infer relationships between entities."
  [entities]
  (for [[a b] (partition 2 1 entities)]
    {:from a :to b :type :related}))

(defn process-text
  "Given raw input string, returns extracted graph nodes and edges."
  [text]
  (let [lines (parse-lines text)
        entities (->> lines (mapcat detect-entity) distinct)
        relations (extract-relationships entities)]
    {:nodes (mapv #(e/create-node {:label % :type :inferred}) entities)
     :edges (mapv #(r/create-edge %) relations)}))

(defn ingest-text
  "Ingests raw input and integrates into current graph state."
  [text graph]
  (let [{:keys [nodes edges]} (process-text text)]
    (-> graph
        (g/add-nodes nodes)
        (g/add-edges edges))))