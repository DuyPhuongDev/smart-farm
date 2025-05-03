import { CropStage } from "@/constants/database";
export const getStageLabel = (stage: CropStage): string => {
  switch (stage) {
    case CropStage.Seed:
      return "Hạt giống";
    case CropStage.Germination:
      return "Nảy mầm";
    case CropStage.Vegetative:
      return "Sinh trưởng";
    case CropStage.Budding:
      return "Ra nụ";
    case CropStage.Flowering:
      return "Ra hoa";
    case CropStage.Fruiting:
      return "Ra quả";
    case CropStage.Maturity:
      return "Trưởng thành";
    case CropStage.Harvest:
      return "Thu hoạch";
    default:
      return "Không xác định";
  }
};
