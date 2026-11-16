package com.guajsama.backend.controller;

import com.guajsama.backend.module.vo.ApiResponse;
import com.guajsama.backend.service.AnnouncementService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/announcements")
public class AnnouncementController {
    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getAnnouncements() {
        return ApiResponse.success(announcementService.getAnnouncements());
    }
}
