import { wsClient } from "../init/client";
import type { Axis, AxisPositions, PrinterProfile } from "../types/printer";
import type { PrinterCommands } from "../types/printer";

/**
 * Printer class implementing printer control commands
 * Handles G-code communication and printer state management
 */
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
        //sum of substract using the direction (which is '-' or '+') from the current position
        let current_position = this.axisPositions[axis]
        let new_position = direction === '+' ? current_position + distance : current_position - distance
        
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `G1 ${new_position}`
        })
    }

    /**
     * Resumes or starts print job (M24)
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
            message: `M106 S${temp}`
        })
    }

    /**
     * Disables stepper motors
     * @param axe - Optional specific axis to disable
     */
    disableMotors(axe?: string): void {
        const message = {
            message_type: 'GCommand',
            message: 'M84'
        }
        
        if(axe) message.message = `M84 ${axe}`

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
     * Selects a file for printing
     * @param file - Filename to select
     */
    selectFile(file: string): void {
        console.log('selecting file')
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M23 ${file}`
        })
    }

    /**
     * Deletes a file from storage
     * @param file - Filename to delete
     */
    deleteFile(file: string): void {
        console.log('deleting file')
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M30 ${file}`
        })
    }
}
