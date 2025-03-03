#!/usr/bin/env python

"""
An example of a trivial websocket server for use with OS-DPI.

Most Incoming messages are json encoded.
{
  state: the current state,
  method: name of the method sending the message
  stateName: the state variable that triggered it
  URL: the associated URL
  content: optional rows from the content
}

Reply with a json encoded message that will trigger the socket handler.

The json encoded message $socket (the "action") is "contextImage", this code
will respond with a message "FetchImageFromDB": $image. OS-DPI will respond to
this special message with the binary content of the requested image.

Gary Bishop June 2023, updated October 2023
Added fetching images in March 2025.
"""

import asyncio
import datetime
import websockets
import json


async def answer(websocket):
    imageName = ""  # name of the context image to fetch
    try:
        async for message in websocket:
            if isinstance(message, bytes):  # image bytes
                if not imageName:
                    print("no image name")
                    continue
                print("got image", imageName)
                with open(imageName, "wb") as fp:
                    fp.write(message)
                imageName = ""
                continue
            print(message)
            event = json.loads(message)
            state = event["state"]
            action = state.get("$socket", "none")
            await asyncio.sleep(
                5
            )  # sleep for a bit to simulate waiting on some service
            if action == "time":
                now = datetime.datetime.now()
                message = f'You said "{state["$Again"]}" at {now:%I:%M%p}'
            elif action == "contextImage":
                imageName = state.get("$image", "")
                await websocket.send(json.dumps({"FetchImageFromDB": imageName}))
                continue
            else:
                message = f'invalid action "{action}"'
            await websocket.send(
                json.dumps(
                    {
                        "message": message,
                        "predictions": [
                            {"sheetName": "predict", "label": "predicted"},
                            {"sheetName": "predict", "label": "words"},
                            {"sheetName": "predict", "label": "from"},
                            {"sheetName": "predict", "label": "the"},
                            {"sheetName": "predict", "label": "socket"},
                        ],
                    }
                )
            )
    finally:
        print("connection closed")


async def main():
    async with websockets.serve(answer, "0.0.0.0", 5678):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
