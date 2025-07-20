;; lisp_reasoning/learning.lisp
(defpackage :reasoning.learning
  (:use :cl :reasoning.graph.hooks)
  (:export :learn-from-corrections))
(in-package :reasoning.learning)

(defun learn-from-corrections (corrections)
  ;; TODO: Implement learning logic
  (print corrections))

(register-hook #'learn-from-corrections)
