(ns knowledge.plugin-watcher
  (:require [clojure.java.io :as io]
            [clojure.tools.namespace.repl :as repl]
            [clojure.tools.namespace.file :as ns-file]
            [knowledge.plugin-api :as plugins])
  (:import [java.nio.file FileSystems Paths StandardWatchEventKinds WatchService]))

(defonce watcher (atom nil))

(defn- watch-loop [watch-service path]
  (future
    (while true
      (let [key (.take watch-service)]
        (doseq [event (.pollEvents key)]
          (let [kind (.kind event)
                filename (.context event)]
            (when (and (= kind StandardWatchEventKinds/ENTRY_MODIFY)
                       (.endsWith (.toString filename) ".clj"))
              (let [fullpath (.resolve path filename)
                    file (io/file (.toString fullpath))]
                (when (.exists file)
                  (try
                    (println "Reloading plugin:" (.getName file))
                    (let [ns-decl (ns-file/read-file-ns-decl file)]
                      (when ns-decl
                        (require ns-decl :reload)
                        (when-let [register (ns-resolve ns-decl 'register)]
                          (register))))
                    (catch Exception e
                      (println "Error reloading plugin:" (.getName file) (.getMessage e))))))))
        (.reset key)))))
        
(defn start-watcher! []
  (when-not @watcher
    (let [watch-service (.newWatchService (FileSystems/getDefault))
          plugin-dir (Paths/get "clojure/plugins" (make-array String 0))]
      (.register plugin-dir watch-service (into-array [StandardWatchEventKinds/ENTRY_MODIFY]))
      (reset! watcher (watch-loop watch-service plugin-dir))
      (println "Plugin watcher started on /clojure/plugins/"))))