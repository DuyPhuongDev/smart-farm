package hcmut.dadn.be.controller;

import hcmut.dadn.be.dto.UserDTO;
import hcmut.dadn.be.dto.UserLoginDTO;
import hcmut.dadn.be.exception.InvalidParamException;
import hcmut.dadn.be.models.User;
import hcmut.dadn.be.response.ApiResponse;
import hcmut.dadn.be.service.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("${api.prefix}/users")
@RequiredArgsConstructor
@RestController
public class UserController {
    private final IUserService userService;

    @PostMapping("/register")
    public ApiResponse<?> create(@Valid @RequestBody UserDTO userDTO
            , BindingResult result) {
            if(result.hasErrors()){
                List<String> errorMessages = result.getFieldErrors()
                        .stream()
                        .map(FieldError::getDefaultMessage)
                        .toList();
                throw new InvalidParamException(errorMessages.toString());
            }
            User user = userService.create(userDTO);
            return new ApiResponse<>(HttpStatus.CREATED.value(), "success", user);
    }

    @PostMapping("/login")
    public ApiResponse<String> login(@Valid @RequestBody UserLoginDTO userLoginDTO){
            String token = userService.login(userLoginDTO.getEmail(), userLoginDTO.getPassword());
            return new ApiResponse<>(HttpStatus.CREATED.value(), "success", token);
    }

}
