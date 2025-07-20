(ns security.encrypt
  (:import [javax.crypto Cipher SecretKeySpec IvParameterSpec]
           [java.util Base64]
           [java.security SecureRandom])
  (:require [clojure.java.io :as io]))

(def ^:private algorithm "AES/CBC/PKCS5Padding")

(defn get-key-from-env []
  (let [key-str (System/getenv "KNOWLEDGE_KEY")]
    (if (and key-str (= (count key-str) 16))
      (.getBytes key-str "UTF-8")
      (throw (Exception. "Missing or invalid 16-char KNOWLEDGE_KEY")))))

(def ^:private key-bytes (get-key-from-env))
(def ^:private key-spec (SecretKeySpec. key-bytes "AES"))

(defn generate-iv []
  (let [iv-bytes (byte-array 16)]
    (.nextBytes (SecureRandom.) iv-bytes)
    iv-bytes))

(defn encrypt
  "Encrypts a byte array using AES/CBC."
  [plaintext-bytes]
  (let [cipher (Cipher/getInstance algorithm)
        iv-bytes (generate-iv)
        iv-spec (IvParameterSpec. iv-bytes)]
    (.init cipher Cipher/ENCRYPT_MODE key-spec iv-spec)
    (let [encrypted (.doFinal cipher plaintext-bytes)
          full (byte-array (+ 16 (alength encrypted)))]
      (System/arraycopy iv-bytes 0 full 0 16)
      (System/arraycopy encrypted 0 full 16 (alength encrypted))
      full)))

(defn decrypt
  "Decrypts AES/CBC-encoded byte array."
  [data]
  (let [iv-bytes (java.util.Arrays/copyOfRange data 0 16)
        encrypted (java.util.Arrays/copyOfRange data 16 (alength data))
        cipher (Cipher/getInstance algorithm)
        iv-spec (IvParameterSpec. iv-bytes)]
    (.init cipher Cipher/DECRYPT_MODE key-spec iv-spec)
    (.doFinal cipher encrypted)))