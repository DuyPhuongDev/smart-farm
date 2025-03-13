package hcmut.dadn.be.util;

import hcmut.dadn.be.exception.InvalidParamException;
import hcmut.dadn.be.models.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtTokenUtil {
    @Value("${jwt.expiration}")
    private int expiration;
    @Value("${jwt.secretKey}")
    private String secretKey;
    public String generateToken(User user) throws InvalidParamException {
        Map<String, Object> claims = new HashMap<>();
        claims.put("username", user.getUsername());
        claims.put("userId", user.getId());
        try {
            String token = Jwts.builder()
                    .claims(claims) //how to extract claims from this ?
                    .subject(user.getUsername())
                    .expiration(new Date(System.currentTimeMillis() + expiration * 1000L))
                    .signWith(getSigningKey())
                    .compact();
            return token;
        }catch (Exception e) {
            throw new InvalidParamException("Cannot create jwt token, error: "+e.getMessage());
        }
    }
    private SecretKey getSigningKey(){
        byte[] bytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(bytes);
    }
    private Claims extractAllClaims(String token) throws IllegalArgumentException{
        try{
            return Jwts.parser()
                    .verifyWith(getSigningKey()) //verify signature
                    .build()
                    .parseSignedClaims(token) //parse token to extract claims
                    .getPayload();
        }catch (Exception e){
            throw new IllegalArgumentException("Cannot extract all claims, error: "+e.getMessage());
        }
    }
    public <T> T extractClaim(String token, Function<Claims, T> claimResolver){
        final Claims claims = extractAllClaims(token);
        return claimResolver.apply(claims);
    }
    private Boolean isTokenExpired(String token){
        Date expiredDate = extractClaim(token, Claims::getExpiration);
        return expiredDate.before(new Date());
    }
    public String extractUsername(String token){
        return extractClaim(token, Claims::getSubject);
    }
    public Boolean validateToken(String token, UserDetails user){
        final String username = extractUsername(token);
        return (username.equals(user.getUsername()) && !isTokenExpired(token));
    }
}
