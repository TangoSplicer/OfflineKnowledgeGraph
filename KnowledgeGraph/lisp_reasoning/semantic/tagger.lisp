;; lisp_reasoning/semantic/tagger.lisp
(defpackage :reasoning.semantic.tagger
  (:use :cl))
(in-package :reasoning.semantic.tagger)

(defun tag-concept (word)
  (cond
    ((search "event" word) (values :event 0.9))
    ((search "person" word) (values :person 0.8))
    ((search "location" word) (values :location 0.7))
    (t (values :unknown 0.4))))