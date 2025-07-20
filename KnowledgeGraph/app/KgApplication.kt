package com.knowledgegraph.app

import android.app.Application
import android.util.Log

class KgApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        try {
            System.loadLibrary("clojure_engine")
            System.loadLibrary("lisp_engine")
            System.loadLibrary("mercury_engine")
            Log.i("KgApplication", "Native libraries loaded successfully")
        } catch (e: UnsatisfiedLinkError) {
            Log.e("KgApplication", "Failed to load native libs", e)
        }
    }
}