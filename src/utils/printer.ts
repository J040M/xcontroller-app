import { wsClient } from "../init/client";
import { Axis, AxisPositions, PrinterProfile } from "../types/printer";

interface PrinterCommands {
    autoHome(): void
    bedLeveling(): void
    moveAxis(axis: Axis, distance: number, direction: string): void
    startPrint(): void
    pausePrint(): void
    stopPrint(): void
    setHotendTemperature(temp: number): void
    setBedTemperature(temp: number): void
    disableMotors(axe?: string): void
    setFanSpeed(speed: number): void
}

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

        //sum of substract using the direction (which is '-' or '+') from the current position
        let current_position = this.axisPositions[axis]
        let new_position = direction === '+' ? current_position + distance : current_position - distance
        
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `G1 ${new_position}`
        })
    }

    // ALSO USED TO RESUME PRINT
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
            message: `M106 S${temp}`
        })
    }

    disableMotors(axe?: string): void {
        const message = {
            message_type: 'GCommand',
            message: 'M84'
        }
        
        if(axe) message.message = `M84 ${axe}`

        wsClient.sendCommand(message)
    }

    setFanSpeed(speed: number): void {
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: `M106 S${speed}`
        })
    }

}
