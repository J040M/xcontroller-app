import { wsClient } from "../init/client";
import { Axis, AxisPositions, PrinterProfile, PrinterCommands } from "../types/printer";

export class Printer implements PrinterCommands {
    /** Stores current printer configuration and state */
    printerInfo: PrinterProfile

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
     * Initiates auto-homing sequence (G28)
     */
    autoHome(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'G28'
        })
    }

    /**
     * Starts automatic bed leveling procedure (G29)
     */
    bedLeveling(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'G29'
        })
    }

    /**
     * Moves specified axis by given distance and direction
     * @param axis - The axis to move (X, Y, Z)
     * @param distance - Distance to move in mm
     * @param direction - Direction of movement ('+' or '-')
     */
    moveAxis(axis: Axis, distance: number, direction: string): void {
        if (!this.printerInfo.homed) return
        //sum of substract using the direction (which is '-' or '+') from the current position
        const current_position = this.axisPositions[axis]
        let new_position = direction === '+' ? current_position + distance : current_position - distance

        // Check for printer limits to avoid crusing things
        if (new_position < 0) new_position = 0
        else if (axis !== 'e' && new_position > this.printerInfo.dimensions[axis]) {
            new_position = this.printerInfo.dimensions[axis]
        }

        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `G1 ${axis}${new_position}`.toUpperCase()
        })

        // Update the axis position after moving
        this.getAxisPosition()
    }

    getAxisPosition(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M114`
        })
    }

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
     * Disables stepper motors
     * @param axe - Optional specific axis to disable
     */
    disableMotors(axe?: string): void {
        // Set homed to false to avoid moving the printer without homing
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
