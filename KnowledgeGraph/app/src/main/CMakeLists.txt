cmake_minimum_required(VERSION 3.22.1)
project("knowledgegraph")

add_library(
    native-lib
    SHARED
    bridge_init.cpp
    interop.cpp
    lisp_bridge.cpp
    mercury_bridge.cpp
)

# Locate native logging library
find_library(
    log-lib
    log
)

# Link JNI + logging
target_link_libraries(
    native-lib
    mercury
    ${log-lib}
)