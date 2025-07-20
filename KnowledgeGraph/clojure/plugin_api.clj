(ns knowledge.plugin-api
  (:require [knowledge.graph :as g]
            [clojure.set :as set]))

(defonce registered-plugins (atom {}))
(defonce enabled-plugins (atom #{}))

(defn register-plugin! [plugin-id plugin-fn meta]
  (swap! registered-plugins assoc plugin-id {:fn plugin-fn :meta meta})
  (swap! enabled-plugins conj plugin-id))

(defn get-plugins []
  (for [[id {:keys [meta]}] @registered-plugins]
    {:id id
     :label (:label meta)
     :enabled (contains? @enabled-plugins id)
     :trigger (:trigger meta)}))

(defn toggle-plugin! [plugin-id]
  (if (contains? @enabled-plugins plugin-id)
    (swap! enabled-plugins disj plugin-id)
    (swap! enabled-plugins conj plugin-id)))

(defn dispatch-plugins [graph-state context]
  (let [results
        (for [[id {:keys [fn meta]}] @registered-plugins
              :when (and (contains? @enabled-plugins id)
                         ((:trigger meta) context))]
          {:plugin-id id
           :label (:label meta)
           :result (fn graph-state context)})]
    results))