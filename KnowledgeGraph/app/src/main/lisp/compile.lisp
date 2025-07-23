(require "asdf")

(asdf:operate 'asdf:load-op :my-lisp-library)

(sb-ext:save-lisp-and-die "lisp.core"
                          :toplevel #'my-lisp-library:main
                          :executable t)
