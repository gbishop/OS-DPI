import os
import requests
from flask import Flask, request, Response, abort

# --- Configuration ---
# The list of origins allowed to use this proxy.
# The 'Origin' header from the client request must match one of these.
whitelist = [
    "https://unc-project-open-aac.github.io",
    "https://gbishop.github.io",
]

# Initialize Flask application
application = app = Flask(__name__)

def inject_cors(response: Response):
    """
    Injects the necessary CORS headers into the Flask response object.
    The original code allowed all methods and headers, so we reflect that here.
    """
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "*"
    # The default max age is usually acceptable, but setting it explicitly is good practice for preflight.
    response.headers["Access-Control-Max-Age"] = "86400" # Cache preflight for 24 hours

@app.route("/", methods=["GET", "OPTIONS"])
def proxy_endpoint():
    """
    Handles both GET requests (the actual proxying) and OPTIONS requests (CORS preflight).
    """
    # 1. Handle CORS Preflight (OPTIONS)
    if request.method == "OPTIONS":
        # Simply return 200 OK with CORS headers for preflight request
        resp = Response()
        inject_cors(resp)
        return resp, 200

    # 2. Whitelist Check (for GET requests)
    origin = request.headers.get("Origin")
    if origin not in whitelist:
        # Use Flask's abort for standard error responses
        app.logger.warning(f"Access denied for origin: {origin}")
        abort(403, description="Origin not in whitelist")

    # 3. Get Target URL from Target-URL header
    target_url = request.headers.get("Target-URL")
    if not target_url:
        app.logger.error("Missing Target-URL header in request.")
        abort(400, description="Missing Target-URL header")

    # 4. Prepare Headers for Outbound Proxy Request
    proxy_headers = {}
    
    # Forward only specific headers required by the original script (If-None-Match)
    if 'If-None-Match' in request.headers:
        proxy_headers['If-None-Match'] = request.headers['If-None-Match']

    # 5. Make the Proxy Request using the requests library
    try:
        # Stream=True for efficient handling of large responses, though not strictly required for small files.
        response_from_target = requests.get(target_url, headers=proxy_headers, stream=True)
        response_from_target.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
    
    except requests.exceptions.HTTPError as e:
        # If the target returned a 4xx or 5xx, we return that status code directly
        app.logger.info(f"Target returned HTTP error: {e.response.status_code}")
        
        # Create a Flask response object with the target's error status and content
        flask_resp = Response(
            e.response.content,
            status=e.response.status_code,
            mimetype=e.response.headers.get("Content-Type")
        )
        inject_cors(flask_resp)
        return flask_resp
        
    except requests.exceptions.RequestException as e:
        # Handle connection errors, DNS failure, timeouts, etc.
        app.logger.error(f"Failed to connect to target URL: {e}")
        abort(502, description="Bad Gateway: Proxy target unreachable")
        
    # 6. Build and Customize Flask Response
    
    # Exclude headers that should not be forwarded to the client (or that Flask handles automatically)
    excluded_headers = [
        'content-encoding', 
        'content-length', 
        'transfer-encoding', 
        'connection',
        # Filter out existing Access-Control headers to ensure we inject our own
        'access-control-allow-origin', 
        'access-control-allow-methods', 
        'access-control-allow-headers', 
        'access-control-expose-headers'
    ]
    
    # Create the final Flask response object from the target's content
    final_response = Response(response_from_target.content, status=response_from_target.status_code)

    # Copy filtered headers from the target response
    for name, value in response_from_target.headers.items():
        if name.lower() not in excluded_headers:
            # Note: headers are copied to the Flask response object
            final_response.headers[name] = value

    # Inject CORS headers (overwriting any previous Access-Control headers)
    inject_cors(final_response)
    
    # Apply custom Cache-Control header as per original script
    final_response.headers["Cache-Control"] = "private, no-cache, no-store, must-revalidate"
    
    return final_response

if __name__ == "__main__":
    # Get port from environment or default to 8080
    port = int(os.environ.get("PORT", 8080))
    # Run the Flask app on all interfaces (0.0.0.0)
    app.run(host="0.0.0.0", port=port, debug=True)
