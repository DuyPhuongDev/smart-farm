package hcmut.dadn.be.service.impl;


import hcmut.dadn.be.dto.UserDTO;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.models.User;
import hcmut.dadn.be.repository.UserRepository;
import hcmut.dadn.be.service.IUserService;
import hcmut.dadn.be.util.JwtTokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;


@Service
@RequiredArgsConstructor
public class UserService implements IUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;

    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }


    @Override
    public User create(UserDTO userDTO) throws DataNotFoundException {
        if(userRepository.existsByEmail(userDTO.getEmail())) {
            throw new DataIntegrityViolationException("Email already exists");
        }
        //convert from userDTO => user
        User newUser = User.builder()
                .fullName(userDTO.getFullName())
                .email(userDTO.getEmail())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .deviceTokens(new ArrayList<>())
                .build();
        return userRepository.save(newUser);
    }

    @Override
    public String login(String email, String password) throws DataNotFoundException {
        User existingUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new DataNotFoundException(
                        "User not found with username or email: " + email)
                );
        //Không nên truyền authorities trước khi authenticate() vì Spring security tự động bỏ qua và
        //sẽ đuược lấy lại từ UserDetailsService sau khi xác thực
        UsernamePasswordAuthenticationToken authenticationToken
                = new UsernamePasswordAuthenticationToken(
                email, password
        );
        authenticationManager.authenticate(authenticationToken);
        return jwtTokenUtil.generateToken(existingUser);
    }

    @Override
    public User getLoggedUser() throws DataNotFoundException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(authentication.getName()).orElseThrow(() -> new DataNotFoundException("User not found with username: " + authentication.getName()));
    }
}
