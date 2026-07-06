/**
 * @file Printer.ts
 * Class representing a 3D printer instance
 * Handles printer control commands and state management
 * Using the verifyConnection() decorator to verify the connection
 */

import { getTransport } from "../init/client";
import { Axis, AxisPositions, PrinterProfile, PrinterCommands } from "../types/printer";
import { eventBus } from "./eventbus";

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
     * Copies user-supplied profile fields (uuid, name, url, dimensions,
     * firmware) onto the live printer state. Called when the user picks a
     * profile in the connector so commands respect the printer's actual
     * dimensions instead of the placeholder defaults.
     */
    bindProfile(profile: PrinterProfile): void {
        this.printerInfo.uuid = profile.uuid
        this.printerInfo.name = profile.name
        this.printerInfo.url = profile.url
        if (profile.dimensions) this.printerInfo.dimensions = profile.dimensions
        if (profile.firmware) this.printerInfo.firmware = profile.firmware
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
        getTransport().sendCommand({
            message_type: 'GCommand',
            message: 'G28'
        })

        this.printerInfo.homed = true

        this.getAxisPosition()
    }

    /**
     * Starts automatic bed leveling procedure (G29)
     * Get the axis position after leveling
     * Reset homed to false to avoid moving the printer without homing
     * @returns {void}
     */
    @Printer.verifyConnection
    bedLeveling(): void {
        this.printerInfo.homed = false

        getTransport().sendCommand({
            message_type: 'GCommand',
            message: 'G29'
        })
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

        const sign = direction === '+' ? 1 : -1

        // Extruder axes extrude/retract by a *relative* amount. The firmware's
        // absolute E position isn't tracked here, so computing an absolute
        // target from it is wrong (it never updates, so repeated presses become
        // no-ops); and gluing the axis name onto the value (`e0` + `5` → `E05`)
        // produced corrupt g-code. Force relative extrusion so each press moves
        // exactly `distance` mm regardless of the current E position.
        if (axis === 'e0' || axis === 'e1') {
            const temps = this.printerInfo.temperatures
            const current = axis === 'e0' ? temps.e0 : temps.e1
            const target = axis === 'e0' ? temps.e0_set : temps.e1_set
            if (Math.abs(current - target) > 3 || current < this.hotendMinTemp) {
                console.error('Extruder temp very different from target temp')
                return
            }

            const commands: string[] = []
            if (axis === 'e1') commands.push('T1') // select the second extruder
            commands.push('M83') // relative extrusion
            commands.push(`G1 E${sign * distance} F300`) // extrude/retract at 5 mm/s
            if (axis === 'e1') commands.push('T0') // restore the first extruder

            for (const message of commands) {
                getTransport().sendCommand({ message_type: 'GCommand', message })
            }
            return
        }

        // Linear axes move to an absolute coordinate, clamped to the bed volume
        // so a jog can't drive the carriage past its limits.
        let position = this.axisPositions[axis] + sign * distance
        if (position < 0) position = 0
        else if (position > this.printerInfo.dimensions[axis]) {
            position = this.printerInfo.dimensions[axis]
        }

        getTransport().sendCommand({
            message_type: 'GCommand',
            message: `G1 ${axis}${position}`,
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

        getTransport().sendCommand({
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
        getTransport().sendCommand({
            message_type: 'GCommand',
            message: `M105`
        })
    }

    /**
     * Retrieves printer status
     * "C" Retrieves file if one is already selected
     * @returns {void}
     */
    @Printer.verifyConnection
    getPrintStatus(): void {
        // Get the selected file
        getTransport().sendCommand({
            message_type: 'GCommand',
            message: `M27 C`
        })
        // Get print completion percentage
        getTransport().sendCommand({
            message_type: 'GCommand',
            message: `M27`
        })
        // Get print time elapsed
        getTransport().sendCommand({
            message_type: 'GCommand',
            message: `M31`
        })

    }

    /**
     * Retrieves list of files stored on the printer
     * @returns {void}
     */
    @Printer.verifyConnection
    listFiles(): void {
        getTransport().sendCommand({
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
        if(this.printerInfo.homed === false) this.autoHome()

        this.printerInfo.printStatus!.state = 'printing'

        getTransport().sendCommand({
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

        getTransport().sendCommand({
            message_type: 'GCommand',
            message: 'M25'
        })
    }

    /**
     * Stops current print job (M29)
     * Resets print status
     * @returns {void}
     */
    @Printer.verifyConnection
    stopPrint(): void {
        this.printerInfo.printStatus!.state = 'unknown'

        getTransport().sendCommand({
            message_type: 'GCommand',
            message: 'M524'
        })

        // Reset print status
        this.printerInfo.printStatus = {
            state: 'idle',
            file_name: '',
            elapsed_time: '',
            estimated_time: 0,
            progress: 0,
        }
    }

    /**
     * Sets hotend temperature
     * @param {number} temp - Target temperature in celsius
     * @returns {void}
     */
    @Printer.verifyConnection
    setHotendTemperature(temp: number): void {
        getTransport().sendCommand({
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
        getTransport().sendCommand({
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

        getTransport().sendCommand(message)
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

        getTransport().sendCommand({
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
            this.printerInfo.printStatus.state = 'unknown'
            return
        }

        this.printerInfo.printStatus = {
            state: 'idle',
            file_name: file_name,
            elapsed_time: '',
            estimated_time: 0,
            progress: 0,
        }

        getTransport().sendCommand({
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
        getTransport().sendCommand({
            message_type: 'GCommand',
            message: `M30 ${file_name}`
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
        getTransport().sendCommand({
            message_type: 'Unsafe',
            message: command
        })
    }

    /**
     * Sends custom command from terminal to the printer
     * @param {string} command 
     * @returns {void}
     */
    @Printer.verifyConnection
    terminalCommand(command: string): void {
        getTransport().sendCommand({
            message_type: 'Terminal',
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
                // Only surface the error dialog if the user has actually tried
                // to connect. Otherwise commands that fire on component mount
                // (e.g. status polling) would pop the dialog at app start.
                if (getTransport().hasAttemptedConnection) {
                    eventBus.emit('message', 'openConnectionErrorDialog');
                }
                return;
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    }
}
