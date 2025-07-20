(ns graph.entities
  (:require [clojure.string :as str]
            [graph.core :as core]))

(defn tokenize [text]
  (->> (str/split text #"\W+")
       (remove str/blank?)
       (map str/lower-case)
       distinct))

(defn guess-entity-type [word]
  (cond
    (re-matches #"[a-z]+\d+" word) :id
    (re-matches #"[A-Z][a-z]+.*" word) :name
    (some #(= word %) ["project" "task" "event" "note"]) :type
    :else :concept))

(defn extract-entities [text]
  (let [tokens (tokenize text)]
    (map (fn [tok]
           {:label tok
            :type (guess-entity-type tok)})
         tokens)))

(defn inject-entities-into-graph [text]
  (let [entities (extract-entities text)]
    (mapv (fn [{:keys [label type]}]
            (core/create-node label {:entity-type type}))
          entities)))