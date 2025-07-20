;; lisp_reasoning/graph/hooks.lisp
(defpackage :reasoning.graph.hooks
  (:use :cl))
(in-package :reasoning.graph.hooks)

(defparameter *graph-hooks* '())

(defun register-hook (f)
  (push f *graph-hooks*))

(defun run-hooks (graph)
  (mapcar (lambda (f) (funcall f graph)) *graph-hooks*))