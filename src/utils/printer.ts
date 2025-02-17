import { wsClient } from "../init/client";
import { Axis, AxisPositions, PrinterProfile, PrinterCommands } from "../types/printer";
import { eventBus } from "./eventbus";

/**
 * Class representing a 3D printer instance
 * Handles printer control commands and state management
 * Using the verifyConnection() decorator to verify the connection
 */
export default class Printer implements PrinterCommands {
    /** Stores current printer configuration and state */
    printerInfo: PrinterProfile

    /**
     *  Fixed minimum temp to avoid breaking things in the hotend
     *  This will not work for most filaments, but it's a good start
     */
    private hotendMinTemp = 190

    /**
     * Creates a new Printer instance
     * @param {PrinterProfile} printer_info - Initial printer configuration
     */
    constructor(printer_info: PrinterProfile) {
        this.printerInfo = printer_info
    }

    /**
     * Sets the current position for all axes
     * @param {AxisPositions} positions - Object containing positions for each axis
     * @returns {void}
     */
    set axisPositions(positions: AxisPositions) {
        this.printerInfo!.axisPositions = positions
    }

    /**
     * Retrieves current positions for all axes
     * @returns {AxisPositions} Current axis positions
     */
    get axisPositions(): AxisPositions {
        return this.printerInfo?.axisPositions
    }

    /**
     * Sets the current temperatures for hotend and bed
     * @param temps - Object containing hotend and bed temperatures
     * @returns {void}
     */
    set temperatures(temps: PrinterProfile['temperatures']) {
        this.printerInfo.temperatures = temps
    }

    /**
     * Retrieves current temperatures for hotend and bed
     * @returns {PrinterProfile['temperatures']} Current temperatures
     */
    get temperatures(): PrinterProfile['temperatures'] {
        return this.printerInfo.temperatures
    }

    /**
     * Initiates auto-homing sequence (G28)
     * Get the axis position after homing
     * @returns {void}
     */
    @Printer.verifyConnection
    autoHome(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'G28'
        })

        this.printerInfo.homed = true

        this.getAxisPosition()
    }

    /**
     * Starts automatic bed leveling procedure (G29)
     * Get the axis position after leveling
     * @returns {void}
     */
    @Printer.verifyConnection
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
     * @param {Axis} axis - The axis to move (X, Y, Z, E)
     * @param {string} direction - Direction of movement ('+' or '-')
     * @param {number} distance - Distance to move in mm
     * @returns {void}
     */
    @Printer.verifyConnection
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

        // Check for hotend temperature before moving
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
     * @returns {void}
     */
    @Printer.verifyConnection
    getAxisPosition(): void {
        if (!this.printerInfo.homed) {
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
     * @returns {void}
     */
    @Printer.verifyConnection
    getTemperatures(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M105`
        })
    }

    /**
     * Retrieves list of files stored on the printer
     * @returns {void}
     */
    @Printer.verifyConnection
    listFiles(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M20'
        })
    }

    /**
     * Starts current print job (M24)
     * @returns {void}
     */
    @Printer.verifyConnection
    startPrint(): void {
        this.printerInfo.printStatus!.state = 'printing'

        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M24'
        })
    }

    /**
     * Pauses current print job (M25)
     * @returns {void}
     */
    @Printer.verifyConnection
    pausePrint(): void {
        this.printerInfo.printStatus!.state = 'paused'

        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M25'
        })
    }

    /**
     * Stops current print job (M29)
     * @returns {void}
     */
    @Printer.verifyConnection
    stopPrint(): void {
        this.printerInfo.printStatus!.state = 'stopped'

        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M29'
        })
    }

    /**
     * Sets hotend temperature
     * @param {number} temp - Target temperature in celsius
     * @returns {void}
     */
    @Printer.verifyConnection
    setHotendTemperature(temp: number): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M104 S${temp}`
        })
    }

    /**
     * Sets bed temperature
     * @param {number} temp - Target temperature in celsius
     * @returns {void}
     */
    @Printer.verifyConnection
    setBedTemperature(temp: number): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M140 S${temp}`
        })
    }

    /**
     * Disables stepper motors, allowing manual movement
     * Set homed to false to avoid moving the printer without homing
     * @param {string} [axe] - Optional specific axis to disable
     * @returns {void}
     */
    @Printer.verifyConnection
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
     * @param {number} speed - Fan speed (0-255)
     * @returns {void}
     */
    @Printer.verifyConnection
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
     * If no file is provided, clears the current selection
     * @param {string} [file_name] - Name of the file to print
     * @returns {void}
     */
    @Printer.verifyConnection
    selectFile(file_name?: string): void {

        if (!file_name) {
            delete this.printerInfo.printStatus
            return
        }

        this.printerInfo.printStatus = {
            state: 'idle',
            file: {
                file_name: file_name,
                file_size: 0,
                file_modified_date: '0'
            },
            elapsed_time: 0,
            estimated_time: 0
        }

        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M23 ${file_name}`
        })
    }

    /**
     * Deletes file from printer storage
     * @param {string} file_name - Name of the file to delete
     * @returns {void}
     */
    @Printer.verifyConnection
    deleteFile(file_name: string): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M30 ${file_name}`
        })
    }

    /**
     * Uploads file to printer storage
     * @param {string} file_content - Content of the file to upload
     * @returns {void}
     */
    @Printer.verifyConnection
    uploadFile(file_content: string): void {
        console.log({
            message_type: 'FileUpload',
            message: file_content
        })
        wsClient.sendCommand({
            message_type: 'FileUpload',
            message: file_content
        })
    }

    /**
     * Sends custom command to the printer without backend validation
     * Most commonly used for debugging and terminal commands
     * @param {string} command 
     * @returns {void}
     */
    @Printer.verifyConnection
    unsafeCommand(command: string): void {
        wsClient.sendCommand({
            message_type: 'Unsafe',
            message: command
        })
    }

    /**
     * Decorator to verify printer connection before executing commands
     * @param {any} _target - The target object
     * @param {string} _propertyKey - The property key
     * @param {PropertyDescriptor} descriptor - The property descriptor
     * @returns {PropertyDescriptor} Modified property descriptor
     */
    private static verifyConnection(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (this: Printer, ...args: any[]) {
            if (!this.printerInfo.status) {
                console.error('Printer is not connected');
                eventBus.emit('message', 'openConnectionErrorDialog');
                return;
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    }
}
