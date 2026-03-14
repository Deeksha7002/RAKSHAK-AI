import os
import sys
import threading
import webbrowser
import logging
from http.server import SimpleHTTPRequestHandler, HTTPServer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [LAUNCHER] - %(message)s')

def serve_frontend(static_dir, port=5173):
    """
    Serves the static files from the build directory.
    """
    os.chdir(static_dir)
    server_address = ('', port)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    logging.info(f"Serving web app at http://localhost:{port}")
    httpd.serve_forever()

def get_base_path():
    """
    Get the absolute path to the resource, works for dev and for PyInstaller.
    """
    if getattr(sys, 'frozen', False):
        # Running as compiled exe
        return sys._MEIPASS
    else:
        # Running from source
        return os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    # 1. Setup paths
    base_path = get_base_path()
    
    # Locate the built web frontend
    # In dev: ./web-app/dist
    # In exe: ./web-app/dist (we will bundle it here)
    web_dist_path = os.path.join(base_path, 'web-app', 'dist')
    
    if not os.path.exists(web_dist_path):
        logging.error(f"Could not find web app build at: {web_dist_path}")
        logging.error("Please run 'npm run build' in the web-app directory first.")
        input("Press Enter to exit...")
        sys.exit(1)

    # 2. Start Frontend Server in a separate thread
    frontend_thread = threading.Thread(target=serve_frontend, args=(web_dist_path,), daemon=True)
    frontend_thread.start()

    # 3. Open Browser
    webbrowser.open("http://localhost:5173")

    # 4. Run the Backend Agent Logic
    # We import main here so it runs in the main thread
    try:
        from main import main as run_agent
        run_agent()
        input("Simulation ended. Press Enter to close...")
    except Exception as e:
        logging.error(f"Error running agent: {e}")
        input("Press Enter to exit...")
