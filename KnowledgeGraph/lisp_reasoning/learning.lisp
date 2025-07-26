;; lisp_reasoning/learning.lisp
(defpackage :reasoning.learning
  (:use :cl :reasoning.graph.hooks :cl-json)
  (:export :learn-from-corrections))
(in-package :reasoning.learning)

(defun parse-corrections (corrections-json)
  (decode-json-from-string corrections-json))

(defun apply-correction (correction)
  (let ((type (cdr (assoc :type correction)))
        (node-id (cdr (assoc :node--id correction)))
        (change (cdr (assoc :change correction))))
    (cond ((string= type "TAG_ADD")
           ;; TODO: Add tag to node
           (format t "Add tags ~a to node ~a~%" (cdr (assoc :tags change)) node-id))
          ((string= type "TAG_REMOVE")
           ;; TODO: Remove tag from node
           (format t "Remove tags ~a from node ~a~%" (cdr (assoc :tags change)) node-id))
          (t (warn "Unknown correction type: ~a" type)))))

(defun learn-from-corrections (corrections)
  (let ((parsed-corrections (parse-corrections corrections)))
    (mapc #'apply-correction parsed-corrections)))

(register-hook #'learn-from-corrections)
