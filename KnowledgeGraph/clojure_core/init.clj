;; clojure_core/init.clj
(ns clojure-core.init
  (:require [clojure-core.state :as state]
            [clojure-core.core :as core]
            [clojure-core.rules.engine :as rules]
            [clojure-core.plugin.registry :as plugins]
            [clojure-core.hooks :as hooks]))

(defn initialize! []
  (state/reset-state!)
  (reset! rules/rules [])
  (reset! plugins/plugins {})
  (reset! hooks/hooks [])
  (println "[INIT] Reasoning system ready."))