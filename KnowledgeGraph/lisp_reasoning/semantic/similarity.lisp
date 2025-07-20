(defpackage :reasoning.semantic.similarity
  (:use :cl))
(in-package :reasoning.semantic.similarity)

(defun similarity-score (a b)
  (let ((count (count-if #'identity (mapcar #'char= (string a) (string b)))))
    (/ count (max (length a) 1))))