(ns core
  (:import [com.sun.jna Library Native Structure Pointer]))

(definterface RustCore
  (^com.sun.ptr create_knowledge_graph [])
  (^void free_knowledge_graph [com.sun.ptr ptr]))

;; Actually JNA uses Pointer instead of com.sun.ptr
(defn -main []
  (println "Clojure FFI integration test starting..."))
