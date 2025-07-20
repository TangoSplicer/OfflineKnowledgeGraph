(defpackage :reasoning.constants
  (:use :cl))
(in-package :reasoning.constants)

(defparameter +default-schema+
  '((person (:name :age))
    (concept (:label :definition))))