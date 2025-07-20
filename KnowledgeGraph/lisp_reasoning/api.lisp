;; lisp_reasoning/api.lisp
(defpackage :reasoning.api
  (:use :cl :reasoning.core :reasoning.schema :reasoning.rules :reasoning.lang.dsl))
(in-package :reasoning.api)

(defun evaluate (expr)
  (eval (read-from-string expr)))

(defun define (entity attrs)
  (reasoning.schema:define-entity entity attrs))

(defun assert (fact)
  (add-fact fact))

(defun run ()
  (apply-rules)
  (all-facts))