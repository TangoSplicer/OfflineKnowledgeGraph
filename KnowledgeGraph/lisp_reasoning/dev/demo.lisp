;; lisp_reasoning/dev/demo.lisp
(defpackage :reasoning.dev.demo
  (:use :cl :reasoning.api :reasoning.lang.dsl))
(in-package :reasoning.dev.demo)

(defun demo-run ()
  (define 'concept '(:attributes (:label :meaning)))
  (assert '(:type concept :label "Knowledge"))
  (defrule knowledge-inferred
    (find-by-keyword "Knowledge")
    (add-fact '(:type insight :description "Knowledge node detected")))
  (run))