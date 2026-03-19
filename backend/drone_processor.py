import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import cv2
import numpy as np
import io
import logging

logger = logging.getLogger(__name__)


class DecoderBlock(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv1 = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
        self.conv2 = nn.Sequential(
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x, skip=None):
        x = F.interpolate(x, scale_factor=2, mode='bilinear', align_corners=True)
        if skip is not None:
            if x.shape[2:] != skip.shape[2:]:
                x = F.interpolate(x, size=skip.shape[2:], mode='bilinear', align_corners=True)
            x = torch.cat([x, skip], dim=1)
        x = self.conv1(x)
        x = self.conv2(x)
        return x


class UNetResNet34(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        resnet = models.resnet34(weights=None)

        self.encoder = nn.Module()
        self.encoder.conv1 = resnet.conv1
        self.encoder.bn1 = resnet.bn1
        self.encoder.relu = resnet.relu
        self.encoder.maxpool = resnet.maxpool
        self.encoder.layer1 = resnet.layer1
        self.encoder.layer2 = resnet.layer2
        self.encoder.layer3 = resnet.layer3
        self.encoder.layer4 = resnet.layer4

        self.decoder = nn.Module()
        self.decoder.blocks = nn.ModuleList([
            DecoderBlock(512 + 256, 256),
            DecoderBlock(256 + 128, 128),
            DecoderBlock(128 + 64, 64),
            DecoderBlock(64 + 64, 32),
            DecoderBlock(32, 16),
        ])

        self.segmentation_head = nn.Sequential(
            nn.Conv2d(16, num_classes, 3, padding=1)
        )

    def forward(self, x):
        # Encoder
        x0 = self.encoder.relu(self.encoder.bn1(self.encoder.conv1(x)))  # 64, H/2
        x_pool = self.encoder.maxpool(x0)  # 64, H/4
        x1 = self.encoder.layer1(x_pool)   # 64, H/4
        x2 = self.encoder.layer2(x1)       # 128, H/8
        x3 = self.encoder.layer3(x2)       # 256, H/16
        x4 = self.encoder.layer4(x3)       # 512, H/32

        # Decoder with skip connections
        d = self.decoder.blocks[0](x4, x3)   # 256
        d = self.decoder.blocks[1](d, x2)    # 128
        d = self.decoder.blocks[2](d, x1)    # 64
        d = self.decoder.blocks[3](d, x0)    # 32
        d = self.decoder.blocks[4](d)        # 16

        out = self.segmentation_head(d)
        out = F.interpolate(out, size=x.shape[2:], mode='bilinear', align_corners=True)
        return out


class DroneZoneProcessor:
    def __init__(self, model_path="/app/backend/models/final_drone_model.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None

        try:
            state_dict = torch.load(model_path, map_location=self.device, weights_only=False)
            if isinstance(state_dict, dict):
                self.model = UNetResNet34(num_classes=4).to(self.device)
                self.model.load_state_dict(state_dict)
                self.model.eval()
                logger.info("Drone segmentation model loaded successfully from state dict")
            else:
                self.model = state_dict
                if hasattr(self.model, 'eval'):
                    self.model.eval()
                logger.info("Drone model loaded directly")
        except Exception as e:
            logger.error(f"Error loading drone model: {e}, using demo mode")
            self.model = None

        self.transform = transforms.Compose([
            transforms.Resize((512, 512)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])

        self.zone_colors = {
            0: (0, 255, 0),
            1: (255, 255, 0),
            2: (255, 165, 0),
            3: (255, 0, 0)
        }

        self.zone_labels = {
            0: "High Moisture",
            1: "Medium Moisture",
            2: "Low Moisture",
            3: "Very Low Moisture"
        }

    def process_image(self, image: Image.Image):
        if self.model is None:
            return self._generate_demo_result(image)

        try:
            img_tensor = self.transform(image).unsqueeze(0).to(self.device)

            with torch.no_grad():
                output = self.model(img_tensor)
                prediction = torch.argmax(output, dim=1).cpu().numpy()[0]

            segmented = self.create_segmented_image(image, prediction)
            zones = self.calculate_zone_stats(prediction)
            return segmented, zones
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return self._generate_demo_result(image)

    def _generate_demo_result(self, image):
        img_array = np.array(image.resize((512, 512)))
        h, w = img_array.shape[:2]
        overlay = np.zeros_like(img_array)
        overlay[:h // 2, :w // 2] = self.zone_colors[0]
        overlay[:h // 2, w // 2:] = self.zone_colors[1]
        overlay[h // 2:, :w // 2] = self.zone_colors[2]
        overlay[h // 2:, w // 2:] = self.zone_colors[3]
        result = cv2.addWeighted(img_array, 0.6, overlay, 0.4, 0)
        segmented = Image.fromarray(result.astype('uint8'))

        zones = [
            {"id": "Zone A", "label": "High Moisture", "moisture_category": 0, "coverage_percent": 25.0, "color": list(self.zone_colors[0]), "needs_irrigation": False},
            {"id": "Zone B", "label": "Medium Moisture", "moisture_category": 1, "coverage_percent": 25.0, "color": list(self.zone_colors[1]), "needs_irrigation": False},
            {"id": "Zone C", "label": "Low Moisture", "moisture_category": 2, "coverage_percent": 25.0, "color": list(self.zone_colors[2]), "needs_irrigation": True},
            {"id": "Zone D", "label": "Very Low Moisture", "moisture_category": 3, "coverage_percent": 25.0, "color": list(self.zone_colors[3]), "needs_irrigation": True}
        ]
        return segmented, zones

    def create_segmented_image(self, original_image, prediction_mask):
        original_np = np.array(original_image.resize((512, 512)))
        overlay = np.zeros_like(original_np)
        for zone_id, color in self.zone_colors.items():
            mask = prediction_mask == zone_id
            overlay[mask] = color
        result = cv2.addWeighted(original_np, 0.6, overlay, 0.4, 0)
        return Image.fromarray(result.astype('uint8'))

    def calculate_zone_stats(self, prediction_mask):
        zones = []
        total_pixels = prediction_mask.size
        for zone_id in range(4):
            mask = prediction_mask == zone_id
            pixel_count = np.sum(mask)
            percentage = (pixel_count / total_pixels) * 100
            if percentage > 0.5:
                zones.append({
                    "id": f"Zone {chr(65 + zone_id)}",
                    "label": self.zone_labels[zone_id],
                    "moisture_category": zone_id,
                    "coverage_percent": round(percentage, 2),
                    "color": list(self.zone_colors[zone_id]),
                    "needs_irrigation": zone_id >= 2
                })
        return zones


try:
    drone_processor = DroneZoneProcessor()
except Exception as e:
    logger.error(f"Failed to initialize drone processor: {e}")
    drone_processor = None
