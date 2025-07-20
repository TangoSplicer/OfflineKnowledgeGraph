(defpackage :reasoning.signal.event
  (:use :cl))
(in-package :reasoning.signal.event)

(defun emit-event (label payload)
  (format t "[EVENT] ~a: ~a~%" label payload))