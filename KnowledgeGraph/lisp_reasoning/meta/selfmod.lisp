;; lisp_reasoning/meta/selfmod.lisp
(defpackage :reasoning.meta.selfmod
  (:use :cl :reasoning.rules))
(in-package :reasoning.meta.selfmod)

(defun redefine-rule (rule-id new-fn)
  (let ((r (find rule-id reasoning.rules::*rules* :key #'rule-id :test #'equal)))
    (when r
      (setf (rule-fn r) new-fn
            (inserted-by r) "system"
            (timestamp r) (get-universal-time)))))