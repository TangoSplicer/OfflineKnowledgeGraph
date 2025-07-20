;; lisp_reasoning/init.lisp
(defpackage :reasoning.init
  (:use :cl :reasoning.core :reasoning.rules :reasoning.plugin.runtime))
(in-package :reasoning.init)

(defun initialize ()
  (reset-facts)
  (clrhash reasoning.rules::*rules*)
  (clrhash reasoning.plugin.runtime::*plugins*)
  (format t "~&[LISP] Reasoning engine initialized.~%"))