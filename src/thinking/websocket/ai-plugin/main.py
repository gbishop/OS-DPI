#!/usr/bin/env python

"""
A unified websocket server that combines text and image processing capabilities.
The server handles four types of requests:
1. Text-based keyword prediction
2. Text-based utterance generation
3. Image-based keyword detection
4. Image-based utterance generation

Chia-Yu Yang April 2025
"""

import asyncio
import json
import os
import websockets
from text_keyword import generate_text_keywords
from text_utterance import generate_text_utterances
from image_keyword import generate_image_keywords
from image_utterance import generate_image_utterances
from utils import check_image_exists

# Ensure image-db folder exists
os.makedirs("./image-db", exist_ok=True)

# Store previous keywords for context
previous_keywords = []
# Store previous action for image processing
previous_action = None

def get_customize_prompt(content):
    """Extract custom prompt from content if available."""
    if not content:
        return None
    for item in content:
        if item["version"] == "latest":
            return item.get("prompt", None)
    return None

async def process_request(action, state, content=None):
    """Process different types of requests based on action."""
    try:
        predictions = []
        cprompt = get_customize_prompt(content)

        global previous_keywords, previous_action
        previous_action = action  # Store the current action
        
        for keyword in previous_keywords:
            predictions.append({"sheetName": "pre-keyword", "label": keyword})
        
        # Handle text-based keyword prediction
        if action == "keyword":
            previous_keywords.append(state["$Display"])
            keywords = generate_text_keywords(state["$Display"], cprompt)
            for keyword in keywords:
                predictions.append({"sheetName": "keyword-prediction", "label": keyword})
        
        # Handle text-based utterance generation
        elif action in ["comment", "question"]:
            previous_keywords.append(state["$Display"])
            utterances = generate_text_utterances(state["$Display"], action, cprompt)
            for utterance in utterances:
                predictions.append({"sheetName": "utterance-prediction", "label": utterance})
        
        # Handle image-based keyword detection
        elif action == "contextImage":
            imageName = state.get("$image", "")
            print(f"[Step 0] User selected image: '{imageName}'")
            
            if check_image_exists(imageName):
                print(f"[Step 0.1] Image '{imageName}' already exists in image-db")
                image_path = os.path.join("./image-db", imageName)
                objects, saved_image_name, error = generate_image_keywords(image_path, imageName)
            else:
                print(f"[Step 0.2] Image not found, requesting download")
                return {"FetchImageFromDB": imageName}
            
            if error:
                return {"message": f"Error: {error}", "predictions": []}
            
            for obj in objects:
                predictions.append({"sheetName": "image-keyword-prediction", "label": obj})
        
        # Handle image-based utterance generation
        elif action in ["image-comment", "image-question"]:
            imageName = state.get("$imageName", "")
            if action == "image-comment":
                format = "comment"
            elif action == "image-question":
                format = "question"
            if check_image_exists(imageName):
                print(f"[Step 0.1] Image '{imageName}' already exists in image-db")
                utterances = generate_image_utterances(imageName, format)
                for utterance in utterances:
                    predictions.append({"sheetName": "image-utterance-prediction", "label": utterance})
            else:
                return {"FetchImageFromDB": imageName}
        
        else:
            return {"message": f'Invalid action "{action}"', "predictions": []}
        
        return {"message": "Success", "predictions": predictions}

    except Exception as e:
        print(f"Error processing request: {e}")
        return {"message": str(e), "predictions": []}

async def handle_image_bytes(websocket, image_bytes, imageName):
    """Handle incoming image bytes data."""
    print(f"[Step 1] Received image data for '{imageName}'")
    
    global previous_action
    
    # Save the image first
    image_path = os.path.join("./image-db", imageName)
    with open(image_path, "wb") as f:
        f.write(image_bytes)
    
    # Use LLaMA Vision model to detect objects
    print(f"[Step 2] Starting object detection for '{imageName}'")
    objects, saved_image_name, error = generate_image_keywords(image_bytes, imageName)
    
    if error:
        print(f"[Error] Failed to detect objects: {error}")
        return
    
    print(f"[Step 3] Successfully detected {len(objects)} objects in '{saved_image_name}'")
    print(f"[Debug] Detected objects: {objects}")
    
    # Prepare predictions based on the previous action
    predictions = []
    
    if previous_action == "contextImage":
        # For object detection, return detected objects
        for obj in objects:
            predictions.append({"sheetName": "image-keyword-prediction", "label": obj})
        message = f"Detected objects in image '{saved_image_name}'"
    
    elif previous_action in ["image-comment", "image-question"]:
        # For utterance generation, generate utterances
        format = "comment" if previous_action == "image-comment" else "question"
        utterances = generate_image_utterances(imageName, format)
        for utterance in utterances:
            predictions.append({"sheetName": "image-utterance-prediction", "label": utterance})
        message = f"Generated utterances for image '{saved_image_name}'"
    
    else:
        print(f"[Error] Unknown action: {previous_action}")
        return
    
    print(f"[Step 4] Sending predictions back to client")
    await websocket.send(
        json.dumps({
            "message": message,
            "predictions": predictions
        })
    )
    print("[Step 5] Successfully sent predictions")

async def answer(websocket):
    """Main websocket handler."""
    imageName = ""  # name of the context image to fetch
    try:
        async for message in websocket:
            if isinstance(message, bytes):  # image bytes
                if not imageName:
                    print("[Error] No image name provided for downloaded image")
                    continue
                await handle_image_bytes(websocket, message, imageName)
                imageName = ""
                continue
            
            print(f"[Received] Message: {message}")
            event = json.loads(message)
            state = event["state"]
            action = state.get("$socket", "none")
            content = event.get("content", None)
            
            result = await process_request(action, state, content)
            
            if "FetchImageFromDB" in result:
                imageName = result["FetchImageFromDB"]
                await websocket.send(json.dumps({"FetchImageFromDB": imageName}))
            else:
                await websocket.send(json.dumps(result))
                
    except Exception as e:
        print(f"Error in websocket handler: {e}")
    finally:
        print("[Connection] WebSocket connection closed")

port = 4560
async def main():
    """Start the websocket server."""
    async with websockets.serve(answer, "0.0.0.0", port, max_size=10 * 1024 * 1024):
        print(f"Server is listening on localhost:{port}")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main()) 