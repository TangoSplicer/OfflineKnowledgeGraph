(ns knowledge.learning
  (:require [clojure.set :as set]
            [clojure.edn :as edn]
            [clojure.java.io :as io]))

(defonce interaction-log (atom {}))
(def ^:private log-file "kg_interactions.edn")

(defn register-interactions! [node-ids]
  (swap! interaction-log
         (fn [log]
           (reduce (fn [m id]
                     (update m id (fnil inc 0)))
                   log node-ids)))
  (save-log!))

(defn get-weight [node-id]
  (let [base (get @interaction-log node-id 0)]
    (min 1.0 (+ 0.1 (* 0.1 base))))

(defn save-log! []
  (spit log-file (pr-str @interaction-log)))

(defn load-log! []
  (let [file (io/file log-file)]
    (when (.exists file)
      (try
        (reset! interaction-log (edn/read-string (slurp file)))
        (catch Exception e
          (println "Failed to load log:" (.getMessage e)))))))

(defn learn-from-corrections! [corrections]
  (doseq [correction corrections]
    (let [[_ original corrected] (re-matches #".*original: (.*), corrected: (.*)" correction)]
      (when (and original corrected)
        (swap! interaction-log
               (fn [log]
                 (-> log
                     (update original (fnil dec 0))
                     (update corrected (fnil inc 0)))))))))