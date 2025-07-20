(defpackage :lisp-reasoning.registry
  (:use :cl)
  (:export :get-plugin-info))

(in-package :lisp-reasoning.registry)

(defun get-plugin-info ()
  '(:id "lisp.reasoning.core"
    :label "Lisp Reasoning Engine"
    :version "0.1.0"
    :language "common-lisp"
    :entrypoint "lisp-reasoning.plugin:run"
    :description "Meta-programmable reasoning engine for adaptive knowledge graph."
    :tags ("reasoning" "inference" "schema" "lisp")))