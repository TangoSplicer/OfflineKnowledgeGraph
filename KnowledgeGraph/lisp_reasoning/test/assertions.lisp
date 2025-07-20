;; lisp_reasoning/test/assertions.lisp
(defpackage :reasoning.test.assertions
  (:use :cl :reasoning.api :reasoning.lang.dsl))
(in-package :reasoning.test.assertions)

(defun test-infer ()
  (initialize)
  (define 'person '(:attributes (:name :age)))
  (assert '(:type person :name "Ada"))
  (defrule infer-genius
    (find-by-keyword "Ada")
    (add-fact '(:type genius :name "Ada")))
  (run))