export const gcommands_list = `
G00 - Rapid Move \n G01 - Linear Move \n
G02 - Clockwise Arc Move \n
G03 - Counter-Clockwise Arc Move \n
G04 - Dwell \n
G20 - Set units to inches \n
G21 - Set units to millimeters \n
G28 - Move to origin (home)
G28 - Return to Home
G29 - Detailed Z-Probe
G30 - Return to Secondary Home
G33 - Thread Cutting
G43 - Tool length offset + (adds an offset)
G44 - Tool length offset - (deducts offset)
G49 - Tool length offset cancel
G90 - Absolute Positioning
G91 - Incremental Positioning
G92 - Set Position
F - Set feed rate
M0 - Unconditional stop
M1 - Optional stop
M2 - End of program
M3 - Start spindle turning clockwise
M4 - Start spindle turning counter-clockwise
M5 - Stop spindle turning
M6 - Tool change
M7 - Mist coolant on
M8 - Flood coolant on
M9 - Coolant off
M12 - Spindle on clockwise at maximum rpm
M13 - Spindle on counter-clockwise at maximum rpm
M14 & M15 - Constant surface speed control
M21 - Initialize SD card
M20 - List SD card
M23 - Select SD file for print
M27 - Report SD print status
M48 - Measure Z Probe repeatability
M50 - Print external settings
M502 - Revert to the default "factory settings"
M500 - Store parameters in EEPROM
M501 - Read parameters from EEPROM
M503 - Print settings
M605 - Dual nozzle duplication mode
M606 - Set output flow rate
M607 - Store current feedrate
M608 - Restore previously stored feedrate
M650 - Mixing extruder set mix
M651 - Mixing extruder save mix
M701 - Load filament
M702 - Unload filament
M703 - Set filament load settings
M705 - Set filament unload settings
M706 - Pause at tool change
M808 - Set software endstops status
M999 - Restart after being stopped
M114 - Get current position
M115 - Get firmware version and capabilities
M119 - Get endstop status
M240 - Trigger camera to take photo
M245 - Increase trim set-point
M246 - Decrease trim set-point
M600 - Filament change pause
M601 - Pause for user
M602 - Resume after user pause
M603 - Set pause length
M226 - Pause job
M227 - Enables reverse run
M228 - Disable reverse run
M229 - Enable forward run
M230 - Disable forward run
M301 - Set PID parameters
M302 - Allow cold extrudes
M303 - Run PID tuning
M105 - Get extruder temperature
M106 - Fan on
M107 - Fan off
M108 - Break out of heating loop
M112 - Emergency stop
M120 - Save current state
M121 - Restore saved state
M226 - Pause job
M229 - Enable forward run
M230 - Disable forward run
M240 - Trigger camera to take photo
`