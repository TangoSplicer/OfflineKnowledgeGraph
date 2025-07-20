(defpackage :reasoning.compose.builder
  (:use :cl))
(in-package :reasoning.compose.builder)

(defun rule-from-schema (entity attrs)
  `(lambda () (add-fact '(:type ,',entity ,@',attrs))))