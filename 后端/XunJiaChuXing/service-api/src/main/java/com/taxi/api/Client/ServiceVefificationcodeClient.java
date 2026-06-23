package com.taxi.api.Client;

import com.taxi.api.response.NumberCodeResponse;
import com.taxi.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;


@FeignClient("service-verificationcode")
public interface ServiceVefificationcodeClient {
    @RequestMapping(method = RequestMethod.GET,value = "/numberCode/{size}")
    Result<NumberCodeResponse> getNumberCode(@PathVariable("size") int size);
}
