(in-package :reasoning.core)

(defun test-add-fact ()
  (reset-facts)
  (add-fact '(:subject "Alice" :relation "knows" :object "Bob"))
  (assert (= 1 (length (all-facts)))))