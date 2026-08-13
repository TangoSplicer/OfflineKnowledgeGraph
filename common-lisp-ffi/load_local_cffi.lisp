(require :asdf)

;; Configure ASDF source-registry to find all .asd files inside dependencies and cffi directories
(asdf:initialize-source-registry
 `(:source-registry
   (:tree ,(merge-pathnames "trivial-features/" *default-pathname-defaults*))
   (:tree ,(merge-pathnames "alexandria/" *default-pathname-defaults*))
   (:tree ,(merge-pathnames "babel/" *default-pathname-defaults*))
   (:tree ,(merge-pathnames "cffi/" *default-pathname-defaults*))
   :inherit-configuration))

;; Load dependencies and cffi systems
(asdf:load-system :trivial-features)
(asdf:load-system :alexandria)
(asdf:load-system :babel)
(asdf:load-system :cffi)
(format t "Successfully loaded Trivial-Features, Alexandria, Babel, and CFFI locally!~%")

;; Test loading the Rust shared library via CFFI
(pushnew #p"/home/ubuntu/OfflineKnowledgeGraph/rust-core/target/release/"
         cffi:*foreign-library-directories*)

(cffi:define-foreign-library rust-core
  (:unix (:or "librust_core.so" "librust_core.dylib"))
  (t (:default "librust_core")))

(cffi:use-foreign-library rust-core)

(cffi:defcfun ("create_knowledge_graph" create-knowledge-graph) :pointer)
(cffi:defcfun ("free_knowledge_graph" free-knowledge-graph) :void (ptr :pointer))

(let ((graph (create-knowledge-graph)))
  (format t "Created knowledge graph at pointer: ~A~%" graph)
  (if (not (cffi:null-pointer-p graph))
      (progn
        (free-knowledge-graph graph)
        (format t "Successfully freed knowledge graph.~%"))
      (format t "Failed to create knowledge graph.~%")))

(quit)
