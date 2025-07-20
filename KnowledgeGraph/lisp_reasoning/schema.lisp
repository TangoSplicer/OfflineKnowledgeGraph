(defpackage :lisp-reasoning.schema
  (:use :cl :lisp-reasoning.utils)
  (:export :define-entity-type
           :define-relation-type
           :*entity-types*
           :*relation-types*))

(in-package :lisp-reasoning.schema)

(defparameter *entity-types* (make-hash-table :test 'equal))
(defparameter *relation-types* (make-hash-table :test 'equal))

(defun define-entity-type (name &optional (description ""))
  (setf (gethash name *entity-types*) `(:name ,name :description ,description)))

(defun define-relation-type (name &optional (description ""))
  (setf (gethash name *relation-types*) `(:name ,name :description ,description)))

;; Example definitions
(define-entity-type "person" "A human individual")
(define-entity-type "project" "A structured endeavor")
(define-relation-type "works-on" "Relationship: person -> project")