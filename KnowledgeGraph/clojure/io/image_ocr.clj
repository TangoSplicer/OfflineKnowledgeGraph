(ns clojure.io.image-ocr
  (:require [clojure.java.shell :as shell]
            [clojure.string :as str]))

(defn extract-ocr-text
  "Runs Tesseract OCR on the given image path and returns the plain text output."
  [^String path]
  (let [output-path (str path ".ocr")
        _ (shell/sh "tesseract" path output-path "--psm" "3")
        txt-path (str output-path ".txt")]
    (if (.exists (java.io.File. txt-path))
      (slurp txt-path)
      "")))