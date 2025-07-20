(defpackage :reasoning.debug.log
  (:use :cl))
(in-package :reasoning.debug.log)

(defun log (msg)
  (format t "[LISP] ~a~%" msg))