# List of gcode commands used in the app

### Control
- Directional movement/extruder: G1 <axis><value> (This could also be G0)
- Disable motors: M84
- Set fan speed: M106
- Bed leveling: G29
- Auto Home: G28

### Temperature
- set hotend temperature
- set bed temperature
- report temperatures: M105

### Status
 - Start print: M24
 - Pause print: M25
 - Stop print: M29

### Files
- Select gcode: M23 <path_of_file>
- Start print: M24 <path_of_file>
- Upload file: M
- Report SD print status: M27 C (report currently open file)
- Report SD print status: M27 S<seconds> (reports every x seconds)
- Delete SD file: M30 <path_to_file>