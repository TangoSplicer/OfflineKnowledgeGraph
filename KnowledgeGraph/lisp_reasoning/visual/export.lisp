;; lisp_reasoning/visual/export.lisp
(defpackage :reasoning.visual.export
  (:use :cl :reasoning.core))
(in-package :reasoning.visual.export)

(defun to-dot ()
  (with-output-to-string (s)
    (format s "digraph G {~%")
    (dolist (f *facts*)
      (format s "  \"~a\";~%" (princ-to-string f)))
    (format s "}~%")))