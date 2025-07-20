;; lisp_reasoning/persist/save.lisp
(defpackage :reasoning.persist.save
  (:use :cl :reasoning.core))
(in-package :reasoning.persist.save)

(defun save-facts (path)
  (with-open-file (out path :direction :output :if-exists :supersede)
    (format out "~s~%" *facts*)))