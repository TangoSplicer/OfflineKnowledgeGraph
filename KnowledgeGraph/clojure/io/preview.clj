(ns io.preview
  (:require [clojure.java.io :as io]))

(defn preview-text
  "Returns the first N lines of a text file as preview."
  [filepath & [lines]]
  (let [n (or lines 10)]
    (with-open [rdr (io/reader filepath)]
      (->> (line-seq rdr)
           (take n)
           (map str/trim)
           (remove empty?)
           (vec)))))