(ns knowledge.api
  (:require [clojure.edn :as edn]
            [knowledge.graph :as g]
            [knowledge.extract :as e]
            [knowledge.mutate :as m]
            [knowledge.learning :as learn]
            [knowledge.plugin-api :as plugins]
            [knowledge.plugin-watcher :as watcher]
            [knowledge.search-engine :as search]))

(defonce ^:private _start-watcher (watcher/start-watcher!))

(defn update-graph-from-json [input-edn]
  (let [{:keys [graph text interacted corrections]} (edn/read-string input-edn)]
    (when interacted
      (learn/register-interactions! interacted))
    (when corrections
      (learn/learn-from-corrections! corrections))
    (m/update-graph graph text e/default-extractor)))

(defn get-plugin-suggestions [input-edn]
  (let [{:keys [graph interacted]} (edn/read-string input-edn)
        state (g/json->graph graph)
        context {:interaction-log interacted}]
    (plugins/dispatch-plugins state context)))

(defn toggle-plugin! [plugin-id]
  (let [sym-id (keyword plugin-id)]
    (plugins/toggle-plugin! sym-id)
    (str "Toggled plugin: " plugin-id)))

(defn run-semantic-search [input-edn]
  (let [{:keys [graph query]} (edn/read-string input-edn)
        state (g/json->graph graph)]
    (search/semantic-search state query)))