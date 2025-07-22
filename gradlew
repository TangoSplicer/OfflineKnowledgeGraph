#!/bin/bash
export JAVA_HOME=${JAVA_HOME:-/usr/lib/jvm/java-11-openjdk}
exec ./gradle/wrapper/gradle-wrapper.jar "$@"
