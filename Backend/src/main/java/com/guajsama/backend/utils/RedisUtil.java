package com.guajsama.backend.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.types.Expiration;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class RedisUtil {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    public ObjTemplate getUrlObjTemplate(){
        return new ObjTemplate();
    }

    public StringTemplate getUrlStringTemplate(){
        return new StringTemplate();
    }

    public void setString(String key, String value, long timeoutMillis) {
        getUrlStringTemplate().set(key, value, timeoutMillis);
    }

    public class ObjTemplate{
       //String
       public void set(String key, Object value) {
           redisTemplate.opsForValue().set(key, value);
       }

       public void set(String key, Object value, long timeout) {
           redisTemplate.opsForValue().set(key, value, Expiration.milliseconds(timeout));
       }

       public Object get(String key) {
           return redisTemplate.opsForValue().get(key);
       }

       public Long increment(String key, long delta) {
           return redisTemplate.opsForValue().increment(key, delta);
       }


       //Hash
       public void hPut(String key, String field, Object value) {
           redisTemplate.opsForHash().put(key, field, value);
       }

       public Object hGet(String key, String field) {
           return redisTemplate.opsForHash().get(key, field);
       }

       public Map<Object, Object> hGetAll(String key) {
           return redisTemplate.opsForHash().entries(key);
       }

       public void hDelete(String key, String... fields) {
           redisTemplate.opsForHash().delete(key, (Object[]) fields);
       }

       //List
       public void lLeftPush(String key, Object value) {
           redisTemplate.opsForList().leftPush(key, value);
       }

       public void lRightPush(String key, Object value) {
           redisTemplate.opsForList().rightPush(key, value);
       }

       public Object lLeftPop(String key) {
           return redisTemplate.opsForList().leftPop(key);
       }

       public Object lRightPop(String key) {
           return redisTemplate.opsForList().rightPop(key);
       }

       public List<Object> lRange(String key, long start, long end) {
           return redisTemplate.opsForList().range(key, start, end);
       }

       //Set
       public void sAdd(String key, Object... values) {
           redisTemplate.opsForSet().add(key, values);
       }

       public Set<Object> sMembers(String key) {
           return redisTemplate.opsForSet().members(key);
       }

       public Boolean sIsMember(String key, Object value) {
           return redisTemplate.opsForSet().isMember(key, value);
       }

       public Long sRemove(String key, Object... values) {
           return redisTemplate.opsForSet().remove(key, values);
       }

       //Zset
       public void zAdd(String key, Object value, double score) {
           redisTemplate.opsForZSet().add(key, value, score);
       }

       public Set<Object> zRangeByScore(String key, double min, double max) {
           return redisTemplate.opsForZSet().rangeByScore(key, min, max);
       }

       public Set<Object> zRevRange(String key, long start, long end) {
           return redisTemplate.opsForZSet().reverseRange(key, start, end);
       }

       public Double zScore(String key, Object value) {
           return redisTemplate.opsForZSet().score(key, value);
       }

       public Long zRemove(String key, Object... values) {
           return redisTemplate.opsForZSet().remove(key, values);
       }
   }

    public class StringTemplate{
        //String
       public void set(String key, String value) {
           stringRedisTemplate.opsForValue().set(key, value);
       }


       public void set(String key, String value, long timeout) {
           stringRedisTemplate.opsForValue().set(key, value, Expiration.milliseconds(timeout));
       }

       public Object get(String key) {
           return stringRedisTemplate.opsForValue().get(key);
       }

       public Long increment(String key, long delta) {
           return stringRedisTemplate.opsForValue().increment(key, delta);
       }

       //Hash
       public void hPut(String key, String field, Object value) {
           stringRedisTemplate.opsForHash().put(key, field, value);
       }

       public Object hGet(String key, String field) {
           return stringRedisTemplate.opsForHash().get(key, field);
       }

       public Map<Object, Object> hGetAll(String key) {
           return stringRedisTemplate.opsForHash().entries(key);
       }

       public void hDelete(String key, String... fields) {
           stringRedisTemplate.opsForHash().delete(key, (Object[]) fields);
       }

       //List
       public void lLeftPush(String key, String value) {
           stringRedisTemplate.opsForList().leftPush(key, value);
       }

       public void lRightPush(String key, String value) {
           stringRedisTemplate.opsForList().rightPush(key, value);
       }

       public Object lLeftPop(String key) {
           return stringRedisTemplate.opsForList().leftPop(key);
       }

       public Object lRightPop(String key) {
           return stringRedisTemplate.opsForList().rightPop(key);
       }

       public List<String> lRange(String key, long start, long end) {
           return stringRedisTemplate.opsForList().range(key, start, end);
       }

       //Set
       public void sAdd(String key, String... values) {
           stringRedisTemplate.opsForSet().add(key, values);
       }

       public Set<String> sMembers(String key) {
           return stringRedisTemplate.opsForSet().members(key);
       }

       public Boolean sIsMember(String key, Object value) {
           return stringRedisTemplate.opsForSet().isMember(key, value);
       }

       public Long sRemove(String key, Object... values) {
           return stringRedisTemplate.opsForSet().remove(key, values);
       }

       //Zset
       public void zAdd(String key, String value, double score) {
           stringRedisTemplate.opsForZSet().add(key, value, score);
       }

       public Set<String> zRangeByScore(String key, double min, double max) {
           return stringRedisTemplate.opsForZSet().rangeByScore(key, min, max);
       }

       public Set<String> zRevRange(String key, long start, long end) {
           return stringRedisTemplate.opsForZSet().reverseRange(key, start, end);
       }

       public Double zScore(String key, Object value) {
           return stringRedisTemplate.opsForZSet().score(key, value);
       }

       public Long zRemove(String key, Object... values) {
           return stringRedisTemplate.opsForZSet().remove(key, values);
       }
   }

    public Boolean delete(String key) {
        return redisTemplate.delete(key);
    }
}

