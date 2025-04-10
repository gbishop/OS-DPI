# AI Plugin for WebSocket Server

This plugin provides AI-powered text and image processing capabilities through a WebSocket server. It uses the LLaMA Vision model to generate keywords and utterances from both text and image inputs.

## Features

- Text-based keyword prediction
- Text-based utterance generation
- Image-based keyword detection
- Image-based utterance generation

## Project Structure

```
ai-plugin/
├── main.py           # Main WebSocket server and request handling
├── model.py          # Model initialization and management
├── utils.py          # Common utility functions
├── text_keyword.py   # Text-based keyword generation
├── text_utterance.py # Text-based utterance generation
├── image_keyword.py  # Image-based keyword detection
└── image_utterance.py # Image-based utterance generation
```

## Requirements

- Python 3.8+
- PyTorch
- Transformers
- WebSockets
- Pillow
- NumPy

See `requirements.txt` for detailed package versions.

## Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Start the WebSocket server:
   ```bash
   python main.py
   ```
2. The server will listen on port 4560 by default
3. Connect to the server using a WebSocket client
4. Send requests in the following format:
   ```json
   {
     "state": {
       "$socket": "action_type",
       "$Display": "input_text",
       "$image": "image_name"  // for image-based actions
     },
     "content": [
       {
         "version": "latest",
         "prompt": "custom_prompt"  // optional
       }
     ]
   }
   ```

## Action Types

- `keyword`: Generate keywords from text
- `comment`: Generate comments from text
- `question`: Generate questions from text
- `contextImage`: Generate keywords from image
- `image-comment`: Generate comments from image
- `image-question`: Generate questions from image

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Chia-Yu Yang 