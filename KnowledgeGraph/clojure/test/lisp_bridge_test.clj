(ns test.lisp-bridge-test
  (:require [runtime.lisp-bridge :as lisp]))

(def sample-facts
  [{:subject "alice" :relation "works-on" :object "Project Alpha"}])

(println "[TEST] Deductions:")
(println (lisp/run-lisp-inference sample-facts))