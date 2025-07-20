(ns knowledge.plugins.reminder
  (:require [knowledge.plugin-api :as api]
            [knowledge.learning :as learn]))

(defn forgotten-nodes [graph-state context]
  (let [recent (set (:interaction-log context))
        forgotten (filter #(not (contains? recent (:id %))) (:nodes graph-state))]
    {:reminders (map #(select-keys % [:id :label]) forgotten)}))

(api/register-plugin!
  :reminder
  forgotten-nodes
  {:label "Forgotten Node Reminder"
   :trigger (fn [ctx] true)})