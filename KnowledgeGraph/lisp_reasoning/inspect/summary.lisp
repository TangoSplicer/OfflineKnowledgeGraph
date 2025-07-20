(defpackage :reasoning.inspect.summary
  (:use :cl :reasoning.core))
(in-package :reasoning.inspect.summary)

(defun summary ()
  (format t "Facts: ~a~%" (length *facts*)))