(defpackage :reasoning.core
  (:use :cl))
(in-package :reasoning.core)

(defparameter *facts* '())

(defun reset-facts () (setf *facts* '()))

(defun add-fact (fact)
  (push fact *facts*))

(defun all-facts ()
  *facts*)