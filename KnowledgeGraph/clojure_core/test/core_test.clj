;; clojure_core/test/core_test.clj
(ns clojure-core.test.core-test
  (:require [clojure.test :refer :all]
            [clojure-core.init :as init]
            [clojure-core.rules.engine :as rules]
            [clojure-core.graph :as graph]))

(deftest test-rule-application
  (init/initialize!)
  (let [g (-> (graph/empty-graph)
              (graph/add-node {:id "n1" :type "person"}))]
    (rules/register-rule! {:when #(some (fn [n] (= "person" (:type n))) (:nodes %))
                           :then #(graph/add-node % {:id "n2" :type "inferred"})})
    (let [g' (rules/apply-rules g)]
      (is (= 2 (count (:nodes g')))))))