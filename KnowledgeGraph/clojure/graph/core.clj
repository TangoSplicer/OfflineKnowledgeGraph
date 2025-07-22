(ns graph.core
  (:require [clojure.set :as set]
            [clojure.uuid :as uuid]
            [clojure.java.jdbc :as jdbc]))

(defrecord Node [id label properties])
(defrecord Edge [id from to type properties])

(def db-spec {:classname "org.h2.Driver"
              :subprotocol "h2"
              :subname "mem:graphdb;DB_CLOSE_DELAY=-1"})

(defn initialize-database []
  (jdbc/db-do-commands db-spec
    ["CREATE TABLE nodes (id VARCHAR(36) PRIMARY KEY, label VARCHAR(255), properties TEXT)"
     "CREATE TABLE edges (id VARCHAR(36) PRIMARY KEY, from_node VARCHAR(36), to_node VARCHAR(36), type VARCHAR(255), properties TEXT)"]))

(initialize-database)

(defn create-node
  [label & [props]]
  (let [id (str (uuid/v1))
        node (->Node id label (or props {}))]
    (jdbc/insert! db-spec :nodes {:id id :label label :properties (pr-str props)})
    node))

(defn create-edge
  [from-id to-id type & [props]]
  (if (and (get-node from-id) (get-node to-id))
    (let [id (str (uuid/v1))
          edge (->Edge id from-id to-id type (or props {}))]
      (jdbc/insert! db-spec :edges {:id id :from_node from-id :to_node to-id :type type :properties (pr-str props)})
      edge)
    (throw (Exception. "Source or target node not found"))))

(defn get-node [id]
  (first (jdbc/query db-spec ["SELECT * FROM nodes WHERE id = ?" id]
                     {:row-fn #(->Node (:id %) (:label %) (read-string (:properties %)))})))

(defn get-edge [id]
  (first (jdbc/query db-spec ["SELECT * FROM edges WHERE id = ?" id]
                     {:row-fn #(->Edge (:id %) (:from_node %) (:to_node %) (:type %) (read-string (:properties %)))})))

(defn all-nodes []
  (jdbc/query db-spec ["SELECT * FROM nodes"]
              {:row-fn #(->Node (:id %) (:label %) (read-string (:properties %)))}))

(defn all-edges []
  (jdbc/query db-spec ["SELECT * FROM edges"]
              {:row-fn #(->Edge (:id %) (:from_node %) (:to_node %) (:type %) (read-string (:properties %)))}))

(defn find-nodes-by-label [label]
  (jdbc/query db-spec ["SELECT * FROM nodes WHERE label = ?" label]
              {:row-fn #(->Node (:id %) (:label %) (read-string (:properties %)))}))

(defn find-edges-by-type [type]
  (jdbc/query db-spec ["SELECT * FROM edges WHERE type = ?" type]
              {:row-fn #(->Edge (:id %) (:from_node %) (:to_node %) (:type %) (read-string (:properties %)))}))

(defn reset-graph! []
  (jdbc/db-do-commands db-spec
    ["DELETE FROM nodes"
     "DELETE FROM edges"]))