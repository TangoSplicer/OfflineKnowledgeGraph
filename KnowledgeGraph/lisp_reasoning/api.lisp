;; lisp_reasoning/api.lisp
(defpackage :reasoning.api
  (:use :cl :reasoning.core :reasoning.schema :reasoning.rules :reasoning.lang.dsl))
(in-package :reasoning.api)

(defun evaluate (expr)
  (eval (read-from-string expr)))

(defun define (entity attrs)
  (reasoning.schema:define-entity entity attrs))

(defun assert (fact)
  (add-fact fact))

(defun run ()
  (apply-rules)
  (all-facts))

(defun run-inference (json-string)
  (let* ((json (cl-json:decode-json-from-string json-string))
         (facts (cdr (assoc :facts json))))
    (reasoning.core:clear-facts)
    (loop for fact in facts
          do (reasoning.core:add-fact (read-from-string fact)))
    (reasoning.core:apply-rules)
    (cl-json:encode-json-to-string (reasoning.core:all-facts))))

(defun run-inference-with-corrections (json-string)
  (let* ((json (cl-json:decode-json-from-string json-string))
         (facts (cdr (assoc :facts json)))
         (corrections (cdr (assoc :corrections json))))
    (reasoning.core:clear-facts)
    (loop for fact in facts
          do (reasoning.core:add-fact (read-from-string fact)))
    (loop for correction in corrections
          do (reasoning.core:add-fact (read-from-string correction)))
    (reasoning.core:apply-rules)
    (cl-json:encode-json-to-string (reasoning.core:all-facts))))

(defun evaluate-rule (rule-string)
  (let ((rule (read-from-string rule-string)))
    (cl-json:encode-json-to-string (eval rule))))