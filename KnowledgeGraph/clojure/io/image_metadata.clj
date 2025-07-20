(ns clojure.io.image-metadata
  (:require [clojure.string :as str]
            [clojure.graph.entities :as entities]
            [clojure.graph.mutation :as mutation])
  (:import [java.io File]
           [com.drew.imaging ImageMetadataReader]
           [com.drew.metadata.exif ExifSubIFDDirectory]
           [com.drew.metadata.exif GpsDirectory]
           [com.drew.metadata.iptc IptcDirectory]
           [com.drew.metadata.xmp XmpDirectory]))

(defn parse-gps [^GpsDirectory gps-dir]
  (when gps-dir
    (let [lat (.getGeoLocation gps-dir)]
      (when lat {:lat (.getLatitude lat)
                 :lon (.getLongitude lat)}))))

(defn parse-exif [^ExifSubIFDDirectory exif-dir]
  (when exif-dir
    {:date (.getDate exif-dir ExifSubIFDDirectory/TAG_DATETIME_ORIGINAL)
     :camera-model (.getDescription exif-dir ExifSubIFDDirectory/TAG_MODEL)
     :exposure (.getDescription exif-dir ExifSubIFDDirectory/TAG_EXPOSURE_TIME)}))

(defn parse-iptc [^IptcDirectory iptc-dir]
  (when iptc-dir
    {:keywords (seq (.getKeywords iptc-dir))
     :caption (.getDescription iptc-dir IptcDirectory/TAG_CAPTION)}))

(defn parse-xmp [^XmpDirectory xmp-dir]
  (when xmp-dir
    (let [meta (.getXMPMeta xmp-dir)]
      {:creator (.getPropertyString meta "dc:creator")
       :subject (.getPropertyString meta "dc:subject")})))

(defn extract-metadata [^String path]
  (let [file (File. path)
        metadata (ImageMetadataReader/readMetadata file)
        gps (parse-gps (.getFirstDirectoryOfType metadata GpsDirectory))
        exif (parse-exif (.getFirstDirectoryOfType metadata ExifSubIFDDirectory))
        iptc (parse-iptc (.getFirstDirectoryOfType metadata IptcDirectory))
        xmp (parse-xmp (.getFirstDirectoryOfType metadata XmpDirectory))]
    (merge gps exif iptc xmp {:path path})))

(defn metadata->graph [meta]
  (let [image-id (str "image-" (hash (:path meta)))
        nodes [{:id image-id
                :type :image
                :attrs {:file (:path meta)
                        :caption (:caption meta)
                        :camera (:camera-model meta)
                        :tags (:keywords meta)
                        :author (:creator meta)
                        :taken (:date meta)}}]
        edges (cond-> []
                (:lat meta)
                (conj {:from image-id :to (str "place-" (:lat meta) "-" (:lon meta))
                       :type :taken_at_location})

                (:date meta)
                (conj {:from image-id :to (str "time-" (.getTime (:date meta)))
                       :type :taken_at_time}))]

    {:nodes nodes :edges edges}))

(defn process-image [path graph]
  (let [meta (extract-metadata path)
        {:keys [nodes edges]} (metadata->graph meta)
        updated-graph (reduce entities/add-node graph nodes)]
    (reduce mutation/add-edge updated-graph edges)))