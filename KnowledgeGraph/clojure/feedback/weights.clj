(ns feedback.weights)

(defn feedback->delta
  "Maps user feedback to weight delta for graph edges."
  [feedback]
  (case feedback
    :confirmed 0.25
    :rejected -0.4
    :uncertain -0.1
    0))