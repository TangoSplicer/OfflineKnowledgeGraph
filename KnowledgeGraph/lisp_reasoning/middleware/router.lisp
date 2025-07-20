;; lisp_reasoning/middleware/router.lisp
(defpackage :reasoning.middleware.router
  (:use :cl :reasoning.api))
(in-package :reasoning.middleware.router)

(defun route (cmd data)
  (case cmd
    (evaluate (evaluate data))
    (define   (apply #'define data))
    (assert   (assert data))
    (run      (run))
    (otherwise (format t "[LISP] Unknown command: ~a~%" cmd))))