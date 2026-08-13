(require :asdf)

;; Configure ASDF source-registry to find all .asd files inside dependencies and cffi directories
(let ((base-dir (or (when (boundp '*load-pathname*) (make-pathname :directory (pathname-directory *load-pathname*)))
                    *default-pathname-defaults*)))
  (asdf:initialize-source-registry
   `(:source-registry
     (:tree ,(merge-pathnames "trivial-features/" base-dir))
     (:tree ,(merge-pathnames "alexandria/" base-dir))
     (:tree ,(merge-pathnames "babel/" base-dir))
     (:tree ,(merge-pathnames "cffi/" base-dir))
     :inherit-configuration)))

;; Load dependencies and cffi systems
(asdf:load-system :trivial-features)
(asdf:load-system :alexandria)
(asdf:load-system :babel)
(asdf:load-system :cffi)
(format t "Successfully loaded Trivial-Features, Alexandria, Babel, and CFFI locally!~%")

;; Test loading the Rust shared library via CFFI using robust pathname resolution
(let* ((base-dir (or (when (boundp '*load-pathname*) (make-pathname :directory (pathname-directory *load-pathname*)))
                     *default-pathname-defaults*))
       (rust-lib-dir (merge-pathnames "../rust-core/target/release/" base-dir)))
  (pushnew rust-lib-dir cffi:*foreign-library-directories*))

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
