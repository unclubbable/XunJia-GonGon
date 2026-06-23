package com.taxi.passenger.JWTPathclass;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "driver")
public class InPath {
    private List<String> inpath;


}
