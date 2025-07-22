(defpackage :lisp-reasoning.engine
  (:use :cl :lisp-reasoning.rules :reasoning.core :reasoning.graph.hooks)
  (:export :inference-engine :make-inference-engine :run-inference))

(in-package :lisp-reasoning.engine)

(defstruct inference-engine
  (rule-set (make-rule-set) :type rule-set))

(defun run-inference (engine fact-base)
  "Main reasoning loop: deduce additional facts from the given base facts."
  (let* ((facts (all-facts fact-base))
         (deduced (apply-rules (inference-engine-rule-set engine) facts))
         (all-facts (remove-duplicates (append facts deduced)
                                      :test #'equal)))
    (run-hooks all-facts)
    all-facts))