;; lisp_reasoning/util/timestamp.lisp
(defpackage :reasoning.util.timestamp
  (:use :cl))
(in-package :reasoning.util.timestamp)

(defun now ()
  (multiple-value-bind (sec min hour day month year)
      (decode-universal-time (get-universal-time))
    (format nil "~4,'0d-~2,'0d-~2,'0dT~2,'0d:~2,'0d:~2,'0dZ"
            year month day hour min sec)))