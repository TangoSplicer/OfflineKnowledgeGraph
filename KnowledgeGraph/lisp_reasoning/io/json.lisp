(defpackage :reasoning.io.json
  (:use :cl))
(in-package :reasoning.io.json)

(defun encode-json (data)
  (format nil "~a" data)) ;; Stub for real encoder

(defun decode-json (json-str)
  (read-from-string json-str))