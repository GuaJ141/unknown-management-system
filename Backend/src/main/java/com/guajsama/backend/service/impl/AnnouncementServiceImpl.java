package com.guajsama.backend.service.impl;

import com.guajsama.backend.mapper.AnnouncementMapper;
import com.guajsama.backend.service.AnnouncementService;
import com.guajsama.backend.service.StudentServiceException;
import com.guajsama.backend.utils.ThreadLocalUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AnnouncementServiceImpl implements AnnouncementService {
    private final AnnouncementMapper announcementMapper;

    public AnnouncementServiceImpl(AnnouncementMapper announcementMapper) {
        this.announcementMapper = announcementMapper;
    }

    @Override
    public List<Map<String, Object>> getAnnouncements() {
        Object claimsObject = ThreadLocalUtils.get();
        if (!(claimsObject instanceof Map<?, ?> claims) || !(claims.get("id") instanceof Number id)) {
            throw new StudentServiceException(HttpStatus.UNAUTHORIZED, "登录信息无效");
        }

        Map<String, Object> viewer = announcementMapper.findActiveAnnouncementViewer(id.longValue());
        if (viewer == null || !(viewer.get("collegeId") instanceof Number collegeId)) {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "当前账户无权查询公告");
        }
        return announcementMapper.findAnnouncements(collegeId.longValue());
    }
}
