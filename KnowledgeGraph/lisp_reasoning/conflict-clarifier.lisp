(in-package :lisp_reasoning)

(defun explain-contradiction (fact-a fact-b context)
  "Attempts to explain why fact-a and fact-b conflict in the given context."
  (let ((cause (find-common-ancestor fact-a fact-b context)))
    (if cause
        (format nil "Contradiction arises because both ~A and ~A derive from ~A." fact-a fact-b cause)
        (format nil "No shared cause found; contradiction likely due to conflicting inputs."))))

(defun find-common-ancestor (a b context)
  "Mock implementation; in production this would trace ancestry via reasoning paths."
  (when (and (stringp a) (stringp b))
    (if (search "project" a) "project-root" nil)))