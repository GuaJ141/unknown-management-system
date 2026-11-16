package com.guajsama.backend.utils;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;


public class EncryptUtils {
    private static final SecureRandom RANDOM = new SecureRandom();

    // md5加密
    public static String getMd5String(String password) {
        try {
            // 生成盐
            byte[] salt = new byte[16];
            //随机往salt写入16个byte
            RANDOM.nextBytes(salt);
            //把盐转成字符串，encode编码，再把字节数组转成字符串
            String saltStr = Base64.getEncoder().encodeToString(salt);

            //使用SHA-256算法加密
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            //加入盐
            md.update(salt);
            //把password转成字节，再与盐进行加密
            byte[] hashed = md.digest(password.getBytes());
            String hashStr = Base64.getEncoder().encodeToString(hashed);

            //返回 盐:密码 格式
            return saltStr + ":" + hashStr;
        } catch (Exception e) {
            throw new RuntimeException("加密失败", e);
        }
    }

    // md5验证 校验成功返回true，失败反之
    public static boolean verify(String password, String encryptedStr) {
        try {
            //先获取盐
            String[] parts = encryptedStr.split(":");
            //下标0为盐，1为加密后的password
            String saltStr = parts[0];
            String encryptedPassword = parts[1];
            //getDecoder解码，decode转成字节数组
            byte[] salt = Base64.getDecoder().decode(saltStr);

            MessageDigest md = MessageDigest.getInstance("SHA-256");
            //把传入的password加密
            md.update(salt);
            byte[] hashed = md.digest(password.getBytes());
            String hashStr = Base64.getEncoder().encodeToString(hashed);
            //加密后与原密文对比，相同则密码是对的
            return hashStr.equals(encryptedPassword);
        } catch (Exception e) {
            return false;
        }
    }
}
