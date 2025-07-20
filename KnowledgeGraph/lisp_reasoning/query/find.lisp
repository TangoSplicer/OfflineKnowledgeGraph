;; lisp_reasoning/query/find.lisp
(defpackage :reasoning.query.find
  (:use :cl :reasoning.core))
(in-package :reasoning.query.find)

(defun find-by-keyword (kw)
  (remove-if-not (lambda (f) (search kw (princ-to-string f))) *facts*))

(defun find-by-entity (entity)
  (remove-if-not (lambda (f) (eq (second f) entity)) *facts*))