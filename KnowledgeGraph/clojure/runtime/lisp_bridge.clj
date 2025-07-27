(ns runtime.lisp-bridge
  (:require [clojure.java.shell :refer [sh]]
            [cheshire.core :as json]
            [inferior-lisp.core :as lisp]))

(def lisp (lisp/make-lisp "sbcl" :load-file "lisp_reasoning/init.lisp"))

(lisp/eval lisp '(reasoning.init/initialize))

(defn run-lisp-inference [fact-list]
  (let [input-json (json/generate-string {:action "infer" :facts fact-list})
        result (lisp/eval-in-package lisp :reasoning.api (list 'run-inference input-json))]
    (json/parse-string result true)))

(defn run-lisp-inference-with-corrections [facts corrections]
  (let [input-json (json/generate-string {:action "infer" :facts facts :corrections corrections})
        result (lisp/eval-in-package lisp :reasoning.api (list 'run-inference-with-corrections input-json))]
    (json/parse-string result true)))

(defn evaluate-lisp-rule [rule]
  (let [result (lisp/eval-in-package lisp :reasoning.api (list 'evaluate-rule rule))]
    (json/parse-string result true)))