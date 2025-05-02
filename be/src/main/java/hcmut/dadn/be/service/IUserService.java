package hcmut.dadn.be.service;


import hcmut.dadn.be.dto.request.UserDTO;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.models.User;

public interface IUserService {
    User create(UserDTO userDTO) throws DataNotFoundException;
    String login(String usernameOrEmail, String password) throws DataNotFoundException;
    User getLoggedUser() throws DataNotFoundException;
}
