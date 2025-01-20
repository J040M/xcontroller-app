import { wsClient } from "../init/client";
import { Axis, AxisPositions, PrinterProfile, PrinterCommands } from "../types/printer";

/**
 * Class representing a 3D printer instance
 * Handles printer control commands and state management
 */
export class Printer implements PrinterCommands {
    /** Stores current printer configuration and state */
    printerInfo: PrinterProfile
    
    /**
     *  Fixed minimum temp to avoid breaking things in the hotend
     *  This will not work for most filaments, but it's a good start
     */
    private hotendMinTemp = 190

    /**
     * Creates a new Printer instance
     * @param printer_info - Initial printer configuration
     */
    constructor(printer_info: PrinterProfile) {
        this.printerInfo = printer_info
    }

    /**
     * Sets the current position for all axes
     * @param positions - Object containing positions for each axis
     */
    set axisPositions(positions: AxisPositions) {
        this.printerInfo!.axisPositions = positions
    }

    /**
     * Retrieves current positions for all axes
     * @returns Current axis positions
     */
    get axisPositions(): AxisPositions {
        return this.printerInfo?.axisPositions
    }

    /**
     * Sets the current temperatures for hotend and bed
     * @param temps - Object containing hotend and bed temperatures
     */
    set temperatures(temps: PrinterProfile['temperatures']) {
        this.printerInfo.temperatures = temps
    }

    /**
     * Retrieves current temperatures for hotend and bed
     * @returns Current temperatures
     */
    get temperatures(): PrinterProfile['temperatures'] {
        return this.printerInfo.temperatures
    }

    /**
     * Initiates auto-homing sequence (G28)
     * Get the axis position after leveling
     */
    autoHome(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'G28'
        })


        this.printerInfo.homed = true
        console.log('Printer homed ', this.printerInfo.homed)

        // Update the axis position after homing
        this.getAxisPosition()
    }

    /**
     * Starts automatic bed leveling procedure (G29)
     * Get the axis position after leveling
     */
    bedLeveling(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'G29'
        })

        // TODO: This is not really necessary, is it!?
        this.autoHome()
    }

    /**
     * Moves specified axis by given distance and direction
     * Get the axis position after leveling
     * Check for printer limits to avoid crusing things
     * GCode requires uppercase letters
     * @param axis - The axis to move (X, Y, Z, E)
     * @param direction - Direction of movement ('+' or '-')
     * @param distance - Distance to move in mm
     */
    moveAxis(axis: Axis, direction: string, distance: number): void {
        if (!this.printerInfo.homed) {
            console.error('Printer must be homed before moving the axis')
            return
        }
        //sum of substract using the direction (which is '-' or '+') from the current position
        const current_position = this.axisPositions[axis]
        let new_position = direction === '+' ? current_position + distance : current_position - distance

        // Check for printer limits to avoid crusing things
        if (new_position < 0) new_position = 0
        else if (axis !== 'e' && new_position > this.printerInfo.dimensions[axis]) {
            new_position = this.printerInfo.dimensions[axis]
        }
        
        if (axis === 'e' && (Math.abs(this.printerInfo.temperatures.e0 - this.printerInfo.temperatures.e0_set) > 3 
        || this.printerInfo.temperatures.e0 < this.hotendMinTemp)) {
            console.error('Extruder temp very different from target temp')
            return
        }

        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `G1 ${axis}${new_position}`.toUpperCase()
        })

        // Update the axis position after moving
        this.getAxisPosition()
    }

    /**
     * Retrieves current position for all axes
     */
    getAxisPosition(): void {
        console.log('Getting axis position')
        if(!this.printerInfo.homed) {
            console.error('Printer must be homed before getting axis position')
            return
        }

        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M114`
        })
    }
    
    /**
     * Retrieves current hotend and bed temperatures
     */
    getTemperatures(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M105`
        })
    }
    
    /**
     * Starts current print job (M24)
     */
    startPrint(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M24'
        })
    }

    /**
     * Pauses current print job (M25)
     */
    pausePrint(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M25'
        })
    }

    /**
     * Stops current print job (M29)
     */
    stopPrint(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M29'
        })
    }

    /**
     * Sets hotend temperature
     * @param temp - Target temperature in celsius
     */
    setHotendTemperature(temp: number): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M104 S${temp}`
        })
    }

    /**
     * Sets bed temperature
     * @param temp - Target temperature in celsius
     */
    setBedTemperature(temp: number): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M140 S${temp}`
        })
    }

    /**
     * Disables stepper motors, allowing manual movement
     * Set homed to false to avoid moving the printer without homing
     * @param axe - Optional specific axis to disable
     */
    disableMotors(axe?: string): void {
        this.printerInfo.homed = false

        const message = {
            message_type: 'GCommand',
            message: 'M84'
        }

        if (axe) message.message += ` ${axe}`

        wsClient.sendCommand(message)
    }

    /**
     * Controls cooling fan speed
     * @param speed - Fan speed (0-255)
     */
    setFanSpeed(speed: number): void {
        if (speed < 0 || speed > 255) {
            console.error('Fan speed must be between 0 and 255')
            return
        }

        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M106 S${speed}`
        })
    }

    /**
     * Selects file for printing
     * @param file - Name of the file to print
     */
    selectFile(file: string): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M23 ${file}`
        })
    }

    /**
     * Deletes file from printer storage
     * @param file - Name of the file to delete
     */
    deleteFile(file: string): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M30 ${file}`
        })
    }
}
