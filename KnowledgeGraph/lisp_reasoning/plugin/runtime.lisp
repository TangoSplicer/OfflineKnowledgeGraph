;; lisp_reasoning/plugin/runtime.lisp
(defpackage :reasoning.plugin.runtime
  (:use :cl))
(in-package :reasoning.plugin.runtime)

(defparameter *plugins* (make-hash-table :test #'equal))

(defun register-plugin (name fn)
  (setf (gethash name *plugins*) fn))

(defun apply-plugins (graph)
  (maphash (lambda (_ f) (funcall f graph)) *plugins*)
  graph)