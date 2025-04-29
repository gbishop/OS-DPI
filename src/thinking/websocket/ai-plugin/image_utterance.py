import os
import time
from PIL import Image
from utils import generate_with_model, extract

def generate_image_utterances(image_name, format):
    """Generate utterances based on image."""
    start_time = time.time()

    image_path = os.path.join("./image-db", image_name)
    image = Image.open(image_path)

    prompt = f"""
    Generate 6 conversational {format}s according to the theme of the image.
    Make the utterances about 5 words in length.
    Provide your answer as a comma-separated list.
    Do not include any additional text or explanations."""
    
    generated_text = generate_with_model(prompt, image)
    end_time = time.time()
    print(f"[Time] generate_image_utterances took {end_time - start_time:.2f} seconds")
    print(f"\n===\ngenerated_text: {extract(generated_text)}")
    return extract(generated_text) 