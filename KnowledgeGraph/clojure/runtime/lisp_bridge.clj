(ns runtime.lisp-bridge
  (:require [clojure.java.shell :refer [sh]]
            [cheshire.core :as json]))

(def lisp-cmd "sbcl") ;; or "ecl" if you're using ECL
(def plugin-entry "(lisp-reasoning.plugin:run %s)")

(defn run-lisp-inference [fact-list]
  (let [input-json (json/generate-string {:action "infer" :facts fact-list})
        wrapped `(progn
                    (load "lisp_reasoning/plugin.lisp")
                    (format t "~a" (princ-to-string
                                     ,(read-from-string
                                       (format plugin-entry input-json)))))
        command ["sbcl" "--eval" (str wrapped)]]
    (let [{:keys [out err exit]} (apply sh command)]
      (if (= exit 0)
        (json/parse-string out true)
        {:error err}))))