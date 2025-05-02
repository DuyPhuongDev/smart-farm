package hcmut.dadn.be.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GardenDTO {
    private String name;
    private String cropName;
    private String cropStage;
    private String description;
    private String location;
    private String groupName;
    private String gardenType;
}
