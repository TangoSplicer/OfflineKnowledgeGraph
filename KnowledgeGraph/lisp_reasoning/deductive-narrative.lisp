(in-package :lisp_reasoning)

(defun generate-deduction-narrative (inference-path)
  "Generates a human-readable narrative from an inference path (list of rule applications)."
  (mapcar (lambda (step)
            (format nil "From ~A and ~A, it follows that ~A."
                    (getf step :premise1)
                    (getf step :premise2)
                    (getf step :conclusion)))
          inference-path))

(defun print-narrative (narrative)
  (loop for line in narrative do (format t "~A~%" line)))