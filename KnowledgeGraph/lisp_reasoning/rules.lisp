(defpackage :lisp-reasoning.rules
  (:use :cl :lisp-reasoning.schema :lisp-reasoning.utils)
  (:export :defrule :*rules* :apply-rules))

(in-package :lisp-reasoning.rules)

(defparameter *rules* (make-hash-table :test 'equal))

(defmacro defrule (name (bindings) &body body)
  `(setf (gethash ,(string name) *rules*)
         (lambda ,bindings ,@body)))

(defun apply-rules (facts)
  (loop for rule in (alexandria:hash-table-values *rules*)
        append (funcall rule facts)))

;; Example rule:
(defrule infer-project-expertise (facts)
  (loop for f in facts
        when (and (equal (getf f :relation) "works-on")
                  (getf f :object))
        collect `(:subject ,(getf f :subject)
                  :relation "likely-expert-in"
                  :object ,(getf f :object)
                  :confidence 0.8)))