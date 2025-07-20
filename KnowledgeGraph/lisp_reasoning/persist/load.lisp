;; lisp_reasoning/persist/load.lisp
(defpackage :reasoning.persist.load
  (:use :cl :reasoning.core))
(in-package :reasoning.persist.load)

(defun load-facts (path)
  (with-open-file (in path :direction :input)
    (loop for fact = (read in nil :eof)
          until (eq fact :eof)
          do (add-fact fact))))