#!/usr/bin/env python

"""
An example of a trivial websocket server for use with OS-DPI.

Incoming messages are json encoded.
{
  state: the current state,
  method: name of the method sending the message
  stateName: the state variable that triggered it
  URL: the associated URL
  content: optional rows from the content
}

Reply with a json encoded message that will trigger the socket handler.

Gary Bishop June 2023, updated October 2023
"""

import asyncio
import datetime
import websockets
import json


async def answer(websocket):
    try:
        async for message in websocket:
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
