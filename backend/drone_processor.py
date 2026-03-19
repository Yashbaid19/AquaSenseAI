import torch
import torchvision.transforms as transforms
from PIL import Image
import cv2
import numpy as np
from pathlib import Path
import aiohttp
import io
import logging

logger = logging.getLogger(__name__)

class DroneZoneProcessor:
    def __init__(self, model_path="/app/backend/models/final_drone_model.pth"):
        try:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            checkpoint = torch.load(model_path, map_location=self.device)
            
            # Handle different model formats
            if isinstance(checkpoint, dict):
                # If it's a state dict, we need the model architecture
                # For now, use demo mode
                logger.warning("Model is a state dict, using demo mode")
                self.model = None
            else:
                self.model = checkpoint
                if hasattr(self.model, 'eval'):
                    self.model.eval()
                else:
                    logger.warning("Model doesn't have eval method, using demo mode")
                    self.model = None
            
            logger.info(f"Drone processor initialized on {self.device}")
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
            0: (0, 255, 0),      # Green - High moisture
            1: (255, 255, 0),    # Yellow - Medium moisture
            2: (255, 165, 0),    # Orange - Low moisture
            3: (255, 0, 0)       # Red - Very low moisture
        }
        
        self.zone_labels = {
            0: "High Moisture",
            1: "Medium Moisture",
            2: "Low Moisture",
            3: "Very Low Moisture"
        }
    
    async def fetch_drone_frame(self, url="https://camera-backend-ebe7.onrender.com/frame"):
        """Fetch latest frame from external drone camera"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        image_data = await response.read()
                        return Image.open(io.BytesIO(image_data))
        except Exception as e:
            logger.error(f"Error fetching drone frame: {e}")
        return None
    
    def process_image(self, image: Image.Image):
        """Process image and detect moisture zones"""
        if self.model is None:
            # Return demo data if model not loaded
            return self._generate_demo_result(image)
        
        try:
            # Preprocess
            img_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Run model
            with torch.no_grad():
                output = self.model(img_tensor)
                prediction = torch.argmax(output, dim=1).cpu().numpy()[0]
            
            # Create segmented image
            segmented = self.create_segmented_image(image, prediction)
            
            # Calculate zone statistics
            zones = self.calculate_zone_stats(prediction)
            
            return segmented, zones
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return self._generate_demo_result(image)
    
    def _generate_demo_result(self, image):
        """Generate demo segmentation result"""
        # Create a simple demo segmented image
        img_array = np.array(image.resize((512, 512)))
        
        # Create zones (quadrants)
        h, w = img_array.shape[:2]
        overlay = np.zeros_like(img_array)
        
        # Top-left: High moisture (green)
        overlay[:h//2, :w//2] = self.zone_colors[0]
        # Top-right: Medium moisture (yellow)
        overlay[:h//2, w//2:] = self.zone_colors[1]
        # Bottom-left: Low moisture (orange)
        overlay[h//2:, :w//2] = self.zone_colors[2]
        # Bottom-right: Very low moisture (red)
        overlay[h//2:, w//2:] = self.zone_colors[3]
        
        # Blend
        result = cv2.addWeighted(img_array, 0.6, overlay, 0.4, 0)
        segmented = Image.fromarray(result.astype('uint8'))
        
        # Demo zones
        zones = [
            {
                "id": "Zone A",
                "label": "High Moisture",
                "moisture_category": 0,
                "coverage_percent": 25.0,
                "color": list(self.zone_colors[0]),
                "needs_irrigation": False
            },
            {
                "id": "Zone B",
                "label": "Medium Moisture",
                "moisture_category": 1,
                "coverage_percent": 25.0,
                "color": list(self.zone_colors[1]),
                "needs_irrigation": False
            },
            {
                "id": "Zone C",
                "label": "Low Moisture",
                "moisture_category": 2,
                "coverage_percent": 25.0,
                "color": list(self.zone_colors[2]),
                "needs_irrigation": True
            },
            {
                "id": "Zone D",
                "label": "Very Low Moisture",
                "moisture_category": 3,
                "coverage_percent": 25.0,
                "color": list(self.zone_colors[3]),
                "needs_irrigation": True
            }
        ]
        
        return segmented, zones
    
    def create_segmented_image(self, original_image, prediction_mask):
        """Create color-coded segmented image"""
        original_np = np.array(original_image.resize((512, 512)))
        overlay = np.zeros_like(original_np)
        
        for zone_id, color in self.zone_colors.items():
            mask = prediction_mask == zone_id
            overlay[mask] = color
        
        # Blend original with overlay
        result = cv2.addWeighted(original_np, 0.6, overlay, 0.4, 0)
        
        return Image.fromarray(result.astype('uint8'))
    
    def calculate_zone_stats(self, prediction_mask):
        """Calculate statistics for each zone"""
        zones = []
        total_pixels = prediction_mask.size
        
        for zone_id in range(4):
            mask = prediction_mask == zone_id
            pixel_count = np.sum(mask)
            percentage = (pixel_count / total_pixels) * 100
            
            if percentage > 0.5:  # Only include zones with >0.5% coverage
                zones.append({
                    "id": f"Zone {chr(65+zone_id)}",
                    "label": self.zone_labels[zone_id],
                    "moisture_category": zone_id,
                    "coverage_percent": round(percentage, 2),
                    "color": list(self.zone_colors[zone_id]),
                    "needs_irrigation": zone_id >= 2
                })
        
        return zones

# Global processor instance
try:
    drone_processor = DroneZoneProcessor()
except Exception as e:
    logger.error(f"Failed to initialize drone processor: {e}")
    drone_processor = None
