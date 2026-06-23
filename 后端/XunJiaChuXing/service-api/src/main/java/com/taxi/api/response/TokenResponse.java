package com.taxi.api.response;

import lombok.Data;


@Data
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
}
