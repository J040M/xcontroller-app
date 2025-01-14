import { wsClient } from "../init/client";
import { Axis, AxisPositions, PrinterProfile, PrinterCommands } from "../types/printer";



export class Printer implements PrinterCommands {
    printerInfo: PrinterProfile

    constructor(printer_info: PrinterProfile) {
        this.printerInfo = printer_info
    }

    set axisPositions(positions: AxisPositions) {
        this.printerInfo!.axisPositions = positions
    }

    get axisPositions(): AxisPositions {
        return this.printerInfo?.axisPositions
    }

    autoHome(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'G28'
        })
    }

    bedLeveling(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'G29'
        })
    }

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

    pausePrint(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M25'
        })
    }

    stopPrint(): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M29'
        })
    }

    setHotendTemperature(temp: number): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M104 S${temp}`
        })
    }

    setBedTemperature(temp: number): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M140 S${temp}`
        })
    }

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

    setFanSpeed(speed: number): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M106 S${speed}`
        })
    }
}
