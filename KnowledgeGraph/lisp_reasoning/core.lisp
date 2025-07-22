(defpackage :reasoning.core
  (:use :cl)
  (:export :fact-base :make-fact-base :add-fact :all-facts))
(in-package :reasoning.core)

(defstruct fact-base
  (facts '() :type list))

(defun add-fact (fact-base fact)
  (push fact (fact-base-facts fact-base)))

(defun all-facts (fact-base)
  (fact-base-facts fact-base))