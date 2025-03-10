package hcmut.dadn.be.service;


import hcmut.dadn.be.dto.UserDTO;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IUserService {
    User create(UserDTO userDTO) throws DataNotFoundException;
    String login(String usernameOrEmail, String password) throws DataNotFoundException;
}
