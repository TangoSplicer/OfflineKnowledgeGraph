(in-package :lisp_reasoning)

(defvar *dynamic-rule-schema* (make-hash-table :test #'equal))

(defun define-relationship-type (name fields)
  "Defines a new relationship type schema at runtime."
  (setf (gethash name *dynamic-rule-schema*) fields))

(defun get-relationship-fields (name)
  (gethash name *dynamic-rule-schema*))