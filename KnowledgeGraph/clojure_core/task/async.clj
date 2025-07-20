;; clojure_core/task/async.clj
(ns clojure-core.task.async
  (:require [clojure.core.async :refer [go <! timeout]]))

(defn delay-task [ms task-fn]
  (go (<! (timeout ms)) (task-fn)))