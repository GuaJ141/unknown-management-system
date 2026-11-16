package com.guajsama.backend.controller;

import com.guajsama.backend.module.vo.ApiResponse;
import com.guajsama.backend.service.CommonService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/common")
public class CommonController {
    private final CommonService commonService;

    public CommonController(CommonService commonService) {
        this.commonService = commonService;
    }

    @GetMapping("/semesters")
    public ApiResponse<List<String>> getSemesters() {
        return ApiResponse.success(commonService.getSemesters());
    }
}
