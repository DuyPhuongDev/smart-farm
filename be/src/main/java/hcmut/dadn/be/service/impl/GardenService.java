package hcmut.dadn.be.service.impl;

import hcmut.dadn.be.dto.request.GardenDTO;
import hcmut.dadn.be.dto.response.GardenResponse;
import hcmut.dadn.be.models.garden.Garden;
import hcmut.dadn.be.models.garden.GardenType;
import hcmut.dadn.be.repository.GardenRepository;
import hcmut.dadn.be.service.IGardenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GardenService implements IGardenService {
    private final GardenRepository gardenRepository;
    private final UserService userService;

    @Override
    public List<GardenResponse> getGardenOfCurrentUser() {
        return gardenRepository.findAllByUserId(userService.getLoggedUser().getId()).stream().map(GardenResponse::fromGarden).toList();
    }

    @Override
    public GardenResponse addGarden(GardenDTO dto) {
        Garden garden = Garden.builder()
                .gardenName(dto.getName())
                .cropName(dto.getCropName())
                .cropStage(dto.getCropStage())
                .description(dto.getDescription())
                .location(dto.getLocation())
                .thumbnail("https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e")
                .groupName(dto.getGroupName())
                .gardenType(GardenType.valueOf(dto.getGardenType()))
                .tasks(new ArrayList<>())
                .devices(new ArrayList<>())
                .user(userService.getLoggedUser())
                .build();
        return GardenResponse.fromGarden(gardenRepository.save(garden));
    }
}
