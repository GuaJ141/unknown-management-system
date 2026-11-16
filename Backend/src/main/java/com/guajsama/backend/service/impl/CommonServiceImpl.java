package com.guajsama.backend.service.impl;

import com.guajsama.backend.mapper.CommonMapper;
import com.guajsama.backend.service.CommonService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommonServiceImpl implements CommonService {
    private final CommonMapper commonMapper;

    public CommonServiceImpl(CommonMapper commonMapper) {
        this.commonMapper = commonMapper;
    }

    @Override
    public List<String> getSemesters() {
        return commonMapper.findSemesters();
    }
}
