(ns knowledge.plugins.ExamplePlugin
  (:require [knowledge.interop :as interop]))

(defn run [graph-state context]
  (let [plugin-api (interop/get-plugin-api)]
    (when plugin-api
      (let [new-node (.createNode plugin-api "New Node" "example")]
        (.createEdge plugin-api new-node (first (:nodes graph-state)) "example")))))
