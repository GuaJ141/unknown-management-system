package com.guajsama.backend.listenner;

import com.guajsama.backend.mapper.CollegeAdminMapper;
import org.springframework.data.redis.annotation.RedisListener;
import org.springframework.stereotype.Component;

@Component
public class AutoDeleteSelectionBatch {
    private static final String SELECTION_BATCH_PREFIX = "course_selection_batch:";

    private final CollegeAdminMapper collegeAdminMapper;

    public AutoDeleteSelectionBatch(CollegeAdminMapper collegeAdminMapper) {
        this.collegeAdminMapper = collegeAdminMapper;
    }

    // Redis must publish expired-key events with notify-keyspace-events Ex.
    @RedisListener(topic = "__keyevent@0__:expired")
    public void expireSelectionBatch(String message) {
        if (message == null || !message.startsWith(SELECTION_BATCH_PREFIX)) {
            return;
        }
        String id = message.substring(SELECTION_BATCH_PREFIX.length());
        if (!id.matches("[1-9][0-9]*")) {
            return;
        }
        collegeAdminMapper.setSelectionBatchToStatusZero(Long.parseLong(id));
    }
}
