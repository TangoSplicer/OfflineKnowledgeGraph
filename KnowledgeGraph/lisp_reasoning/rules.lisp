(defpackage :lisp-reasoning.rules
  (:use :cl :lisp-reasoning.schema :lisp-reasoning.utils)
  (:export :rule :make-rule :rule-set :make-rule-set :defrule :apply-rules))

(in-package :lisp-reasoning.rules)

(defstruct rule
  (name "" :type string)
  (body nil :type function)
  (priority 0 :type integer)
  (certainty 1.0 :type float))

(defstruct rule-set
  (rules '() :type list))

(defmacro defrule (rule-set name (bindings) &key (priority 0) (certainty 1.0) &body body)
  `(push (make-rule :name ,(string name)
                    :body (lambda ,bindings ,@body)
                    :priority ,priority
                    :certainty ,certainty)
         (rule-set-rules ,rule-set)))

(defun apply-rules (rule-set facts)
  (let ((sorted-rules (sort (copy-list (rule-set-rules rule-set)) #'> :key #'rule-priority)))
    (loop for rule in sorted-rules
          append (let ((results (handler-case (funcall (rule-body rule) facts)
                                 (error (e)
                                   (format *error-output* "Error applying rule ~a: ~a~%" (rule-name rule) e)
                                   nil))))
                   (mapcar (lambda (result)
                             (if (getf result :certainty)
                                 result
                                 (list* :certainty (rule-certainty rule) result)))
                           results)))))