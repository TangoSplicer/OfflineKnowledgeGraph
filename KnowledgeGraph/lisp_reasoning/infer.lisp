;; lisp_reasoning/infer.lisp
(defpackage :reasoning.infer
  (:use :cl :reasoning.core))
(in-package :reasoning.infer)

(defparameter *inference-cache* (make-hash-table :test #'equal))

(defun infer-fact (pattern)
  (or (gethash pattern *inference-cache*)
      (let ((result (find-if (lambda (fact) (search pattern (princ-to-string fact)))
                             *facts*)))
        (when result
          (setf (gethash pattern *inference-cache*) result))
        result)))