package com.guajsama.backend.utils;

import java.util.Map;

public class ThreadLocalUtils {
    private static final ThreadLocal THREAD_LOCAL = new ThreadLocal<>();

    public static <T> T get(){
        return (T) THREAD_LOCAL.get();
    }

    public static void set(Object value){
        THREAD_LOCAL.set(value);
    }

    public static void remove(){
        THREAD_LOCAL.remove();
    }

    public static Integer getId(){
        Map<String, Object> map = ThreadLocalUtils.get();
        return (Integer) map.get("id");
    }

     public static String getUsername(){
         Map<String, Object> map = ThreadLocalUtils.get();
         return (String) map.get("username");
     }
}
