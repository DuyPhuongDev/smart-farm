package hcmut.dadn.be.controller;

import hcmut.dadn.be.dto.request.UserDTO;
import hcmut.dadn.be.dto.request.UserLoginDTO;
import hcmut.dadn.be.exception.InvalidParamException;
import hcmut.dadn.be.models.User;
import hcmut.dadn.be.dto.response.UserProfileResponse;
import hcmut.dadn.be.service.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping("${api.prefix}/auth")
@RequiredArgsConstructor
@RestController
public class UserController {
    private final IUserService userService;

    @PostMapping("/register")
    public UserProfileResponse create(@Valid @RequestBody UserDTO userDTO
            , BindingResult result) {
            if(result.hasErrors()){
                List<String> errorMessages = result.getFieldErrors()
                        .stream()
                        .map(FieldError::getDefaultMessage)
                        .toList();
                throw new InvalidParamException(errorMessages.toString());
            }
            return UserProfileResponse.fromUser(userService.create(userDTO));
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody UserLoginDTO userLoginDTO){
            String token = userService.login(userLoginDTO.getEmail(), userLoginDTO.getPassword());
            return Map.of("accessToken", token);
    }

    @GetMapping("/me")
    public UserProfileResponse getProfile() {
        User user = userService.getLoggedUser();
        return UserProfileResponse.fromUser(user);
    }
}
