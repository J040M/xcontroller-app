import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  allowComposition: true,
  // Import from external files
  messages: {
    en: {
      files: {
        filename: 'Filename:',
        file_modified_date: 'Modified:',
        filesize: 'Size:',
      },
      status: {
        state: 'State:',
        file: 'File:',
        elapsed_time: 'Elapsed time:',
        estimated_time: 'Estimated time:'
      },
      connector: {
        status: 'Connection status:',
        connect: 'Connect',
        disconnect: 'Disconnect'
      },
      main: {
        control: 'Control',
        temperature: 'Temperature',
        terminal: 'Terminal',
        printerconfig: 'Printer Config',
        gcodeviewer: 'Gcode viewer',
      },
      control: {
        movement_value: 'Movement value (X,Y,Z)',
        extruder_value: 'Extruder value (E)',
        btn_extrude: 'Extrude',
        btn_retract: 'Retract'
      },
      printerconfig: {
        btn_save: 'Save',
        btn_M115: 'Get printer information (M115)'
      },
      temperature: {
        grad_extruder: 'Extruder',
        grad_bed: 'Bed'
      }
    },
    fr: {
        files: {
            filename: 'Fichier:',
            file_modified_date: 'Modifié',
            filesize: 'Taille:',
          },
          status: {
            state: 'État:',
            file: 'Fichier:',
            elapsed_time: 'Temps écoulé:',
            estimated_time: 'Temps estimé:'
          },
          connector: {
            status: 'État de la connection:',
            connect: 'Connecter',
            disconnect: 'Déconnecter'
          },
          main: {
            control: 'Control',
            temperature: 'Temperature',
            terminal: 'Terminal',
            printerconfig: 'Printer Config',
            gcodeviewer: 'Gcode viewer',
          },
          control: {
            movement_value: 'Movement value (X,Y,Z)',
            extruder_value: 'Buse value (E)',
            btn_extrude: 'Extrude',
            btn_retract: 'Retract'
          },
          printerconfig: {
            btn_save: 'Enregistrer',
            btn_M115: 'Retrouver infos (M115)'
          },
          temperature: {
            grad_extruder: 'Buse',
            grad_bed: 'Plateau'
          }
    }
  }
})