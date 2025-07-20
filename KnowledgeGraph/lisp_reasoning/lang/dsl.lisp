;; lisp_reasoning/lang/dsl.lisp
(defpackage :reasoning.lang.dsl
  (:use :cl :reasoning.rules))
(in-package :reasoning.lang.dsl)

(defmacro defrule (name pattern action)
  `(define-rule
     (lambda ()
       (when ,pattern
         ,action))
     ,(symbol-name name)))