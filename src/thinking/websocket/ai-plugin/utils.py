import re
import os
from model import get_model, get_processor, get_empty_image

def check_image_exists(image_name):
    """Check if image exists in image-db folder."""
    image_path = os.path.join("image-db", image_name)
    return os.path.exists(image_path)

def generate_with_model(prompt, image=None, max_new_tokens=100):
    """Generate text using the model with optional image input."""
    if image is None:
        image = get_empty_image()
    
    messages = [
        {"role": "user", "content": [
            {"type": "image"},
            {"type": "text", "text": prompt}
        ]}
    ]
    
    input_text = get_processor().apply_chat_template(messages, add_generation_prompt=True)
    inputs = get_processor()(
        image,
        input_text,
        add_special_tokens=False,
        return_tensors="pt"
    ).to(get_model().device)
    
    output = get_model().generate(**inputs, max_new_tokens=max_new_tokens)
    return get_processor().decode(output[0])

def extract(text):
    """
    Extract text between <|start_header_id|>assistant<|end_header_id|> and <|eot_id|> and split it into a list based on newlines or commas."""
    pattern = r'<\|start_header_id\|>assistant<\|end_header_id\|>(.*?)<\|eot_id\|>'
    match = re.search(pattern, text, re.DOTALL)
    
    if match:
        extracted_text = match.group(1).strip()
        # Split by newlines first, then by commas
        items = []
        for line in extracted_text.split('\n'):
            if line.strip():
                items.extend([item.strip() for item in line.split(', ') if item.strip()])
        return items
    return [] 