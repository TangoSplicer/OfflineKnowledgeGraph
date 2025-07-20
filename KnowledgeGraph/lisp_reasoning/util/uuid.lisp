;; lisp_reasoning/util/uuid.lisp
(defpackage :reasoning.util.uuid
  (:use :cl))
(in-package :reasoning.util.uuid)

(defun generate-id ()
  (format nil "~36,'0x" (random most-positive-fixnum)))