import time
from utils import generate_with_model, extract

def generate_text_keywords(keyword, cprompt=None):
    """Generate keywords based on input keyword and optional custom prompt."""
    start_time = time.time()
    if cprompt not in [None, ""]:
        prompt = f"""
        KEYWORDS: {keyword}
        {cprompt}
        Generate your answer separated by a comma.
        Only generate the word, do not generate anything irrelevant.
        For example: <word1>, <word2>, ...
        """
    else:
        prompt = f"""
        What are 10 words related to '{keyword}'? 
        Generate your answer separated by a comma.
        Only generate the word, do not generate anything irrelevant.
        For example: <word1>, <word2>, ...
        """

    generated_text = generate_with_model(prompt)
    end_time = time.time()
    print(f"[Time] generate_text_keywords took {end_time - start_time:.2f} seconds")
    print(f"\n===\ngenerated_text: {extract(generated_text)}")
    return extract(generated_text) 