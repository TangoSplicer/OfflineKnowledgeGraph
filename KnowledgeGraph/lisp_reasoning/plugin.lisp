(defpackage :lisp-reasoning.plugin
  (:use :cl :lisp-reasoning.engine)
  (:export :run))

(in-package :lisp-reasoning.plugin)

(defun run (request)
  "Request should be a plist like (:action 'infer :facts [...])"
  (let ((action (getf request :action)))
    (cond
      ((equal action "infer")
       (let ((facts (getf request :facts))
             (corrections (getf request :corrections)))
         (when corrections
           (reasoning.learning:learn-from-corrections corrections))
         (run-inference facts)))
      (t
       `(:error "Unknown action")))))

(defun evaluate-rule (rule)
  (eval (read-from-string rule)))