package com.taxi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Cipher;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;

/**
 * 管理端登录 RSA：启动时生成密钥对，前端用公钥加密密码，后端私钥解密后再做 BCrypt 校验。
 */
@Configuration
public class RsaKeyConfig {

    private static final String RSA_TRANSFORMATION = "RSA/ECB/PKCS1Padding";

    @Bean
    public RsaKeyHolder rsaKeyHolder() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();
        return new RsaKeyHolder(keyPair.getPublic(), keyPair.getPrivate());
    }

    public static class RsaKeyHolder {
        private final PublicKey publicKey;
        private final PrivateKey privateKey;
        private final String publicKeyPem;

        public RsaKeyHolder(PublicKey publicKey, PrivateKey privateKey) {
            this.publicKey = publicKey;
            this.privateKey = privateKey;
            this.publicKeyPem = toPem(publicKey);
        }

        public String getPublicKeyPem() {
            return publicKeyPem;
        }

        public String decrypt(String base64CipherText) throws Exception {
            byte[] encrypted = Base64.getDecoder().decode(base64CipherText);
            Cipher cipher = Cipher.getInstance(RSA_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, privateKey);
            byte[] plain = cipher.doFinal(encrypted);
            return new String(plain, StandardCharsets.UTF_8);
        }

        private static String toPem(PublicKey publicKey) {
            String base64 = Base64.getEncoder().encodeToString(publicKey.getEncoded());
            StringBuilder sb = new StringBuilder();
            sb.append("-----BEGIN PUBLIC KEY-----\n");
            for (int i = 0; i < base64.length(); i += 64) {
                sb.append(base64, i, Math.min(i + 64, base64.length())).append('\n');
            }
            sb.append("-----END PUBLIC KEY-----");
            return sb.toString();
        }
    }
}
