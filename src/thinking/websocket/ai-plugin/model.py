import torch
import numpy as np
from PIL import Image
from transformers import MllamaForConditionalGeneration, AutoProcessor

# Initialize LLaMA Vision model
model_id = "meta-llama/Llama-3.2-11B-Vision-Instruct"
model = MllamaForConditionalGeneration.from_pretrained(
    model_id,
    torch_dtype=torch.bfloat16,
    device_map="auto",
)
processor = AutoProcessor.from_pretrained(model_id)

# Create empty image for text-only tasks
empty_image = Image.fromarray(np.zeros((224, 224, 3), dtype=np.uint8))

# Make model and processor available to other modules
def get_model():
    return model

def get_processor():
    return processor

def get_empty_image():
    return empty_image 