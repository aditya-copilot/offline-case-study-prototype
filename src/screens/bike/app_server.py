import importlib.util
import pathlib

# Load existing Untitled-1.py as a module because filename is not a valid Python module name
source_path = pathlib.Path(__file__).parent / "Untitled-1.py"
spec = importlib.util.spec_from_file_location("beacon_app", source_path)
beacon_app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(beacon_app)

app = beacon_app.app
