(ns runtime.bridge)

(defn error [msg & [data]]
  {:status "error"
   :message msg
   :data data})

(defn ok [data]
  {:status "ok"
   :data data})

(defn safe-call [f & args]
  (try
    (ok (apply f args))
    (catch Exception e
      (error (.getMessage e)))))