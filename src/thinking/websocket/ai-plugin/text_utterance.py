import time
from utils import generate_with_model, extract

def generate_text_utterances(keyword, format, cprompt=None):
    """Generate utterances based on text keyword."""
    start_time = time.time()
    if cprompt not in [None, ""]:
        prompt = f"""
        KEYWORDS: {keyword}, FORMAT: {format}
        {cprompt}
        All the utterances should be in {format} format.
        Separate each {format} with a comma, and ensure each {format} relates specifically to the keywords.
        Do not include any additional text or explanations. 
        Example format: <{format}1>, <{format}2>, <{format}3>, <{format}4>, <{format}5>, <{format}6>.
        """
    else:
        prompt = f"""
        KEYWORDS: {keyword}
        Use all keywords provided to complete 6 grammatically correct {format}s. Make the utterances about five words in length. 
        Separate each {format} with a comma, and ensure each {format} relates specifically to the keywords.
        Do not include any additional text or explanations. 
        Example format: <{format}1>, <{format}2>, <{format}3>, <{format}4>, <{format}5>, <{format}6>.
        """
    
    generated_text = generate_with_model(prompt)
    end_time = time.time()
    print(f"[Time] generate_text_utterances took {end_time - start_time:.2f} seconds")
    print(f"\n===\ngenerated_text: {extract(generated_text)}")
    return extract(generated_text) 