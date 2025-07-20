(ns clojure-core.graph-test
  (:require [clojure.test :refer :all]
            [clojure-core.graph :refer :all]))

(deftest test-add-node
  (let [g (empty-graph)
        g2 (add-node g {:id "1" :type "concept"})]
    (is (= 1 (count (:nodes g2))))))