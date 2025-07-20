(ns clojure.io.meta-extract
  (:require
    [clojure.io.image-metadata :as img-meta]
    [clojure.io.image-ocr :as ocr]
    [clojure.io.preview :as preview]
    [clojure.io.meta-extract.text :as text-meta]
    [clojure.graph.core :as graph]
    [clojure.graph.entities :as entities]
    [clojure.graph.mutation :as mutation]
    [clojure.string :as str]))

(defn extract-file-meta
  "Dispatch file import to the correct metadata extractor based on file extension."
  [path graph]
  (let [lower-path (str/lower-case path)]
    (cond
      (re-matches #".*\.(jpg|jpeg|png)$" lower-path)
      (let [graph-with-meta (img-meta/process-image path graph)
            text (ocr/extract-ocr-text path)]
        (if (seq text)
          (text-meta/process-raw-text text graph-with-meta)
          graph-with-meta))

      (re-matches #".*\.txt$" lower-path)
      (text-meta/process-text path graph)

      (re-matches #".*\.(md|markdown)$" lower-path)
      (text-meta/process-markdown path graph)

      (re-matches #".*\.pdf$" lower-path)
      (text-meta/process-pdf path graph)

      :else
      (do
        (println "[WARN] Unknown file type for metadata extraction:" path)
        graph))))