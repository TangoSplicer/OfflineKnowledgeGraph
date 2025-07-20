(defpackage :lisp-reasoning.engine
  (:use :cl :lisp-reasoning.rules)
  (:export :run-inference :infer-new-facts))

(in-package :lisp-reasoning.engine)

(defun infer-new-facts (existing-facts)
  (apply-rules existing-facts))

(defun run-inference (fact-list)
  "Main reasoning loop: deduce additional facts from the given base facts."
  (let ((deduced (infer-new-facts fact-list)))
    (remove-duplicates (append fact-list deduced)
                       :test #'equal)))