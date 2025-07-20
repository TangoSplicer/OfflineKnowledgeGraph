(in-package :lisp_reasoning.macros)

(defmacro define-inference-rule (name (a b) conclusion)
  "Defines a symbolic inference rule that can be stored and interpreted."
  `(progn
     (defun ,name (,a ,b)
       ,conclusion)
     (pushnew ',name *inference-rule-registry*)))

(defparameter *inference-rule-registry* '())