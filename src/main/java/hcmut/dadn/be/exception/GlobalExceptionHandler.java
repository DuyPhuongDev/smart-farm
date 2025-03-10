package hcmut.dadn.be.exception;


import hcmut.dadn.be.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(CustomException.class)
    public ApiResponse<?> handleCustomException(CustomException e) {
        EnumException enumException = e.getEnumException();
        return ApiResponse.builder()
                .status(enumException.getStatusCode().value())
                .message(enumException.getMessage())
                .build();
    }

    @ExceptionHandler(DataNotFoundException.class)
    public ApiResponse<?> handleDataNotFoundException(DataNotFoundException e) {
        return ApiResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message(e.getMessage())
                .build();
    }

    @ExceptionHandler(InvalidParamException.class)
    public ApiResponse<?> handleInvalidParamException(InvalidParamException e) {
        return ApiResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message(e.getMessage())
                .build();
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handleException(Exception e) {
        return ApiResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message(e.getMessage())
                .build();
    }
}