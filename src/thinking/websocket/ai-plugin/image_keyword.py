import os
import time
from io import BytesIO
from PIL import Image
from utils import generate_with_model, extract, check_image_exists

def generate_image_keywords(image_data, image_name=None):
    """Detect objects in the provided image using LLaMA Vision model."""
    start_time = time.time()
    
    try:
        if image_name:
            image_path = os.path.join("./image-db", image_name)
            
            # Handle image data based on its type
            if isinstance(image_data, bytes):
                # If it's bytes (from download), save it first
                with open(image_path, "wb") as f:
                    f.write(image_data)
                image = Image.open(BytesIO(image_data))
            else:
                # If it's a file path (existing image)
                image = Image.open(image_path)
        else:
            image = Image.open(BytesIO(image_data))
        
        # Prepare prompt for vision model
        prompt = """
        What are 10 words related to the image?
        Provide your answer as a comma-separated list of objects.
        Do not include any additional text or explanations."""

        generated_text = generate_with_model(prompt, image)
        
        end_time = time.time()
        print(f"[Time] generate_image_keywords took {end_time - start_time:.2f} seconds")
        print(f"\n===\ngenerated_text: {extract(generated_text)}")
        return extract(generated_text), image_name if image_name else "", ""

    except Exception as e:
        print(f"Error in generate_image_keywords: {e}")
        return [], "", str(e) 