import { mapGetters, mapActions } from 'vuex';
import Time from '../common/time';
import {
  sumTimes,
  substractTimes,
  numToTime,
  timeTonum,
  oneLessThan,
} from '../common/scheduler';
import daysEnum from '../common/days';
// Esta es nuestra base de datos temporal (para pruebas rápidas)
import bd from '../common/faker';

export default {
  data: () => ({
    // diasselect, dias, horarioInicio, horaFin
    // son variables para la funcionalidad de agregar
    // actividad, son variables temporales, se removeran a terminar pruebas
    // estan aqui porque no habia considerado el trabajo colaborativo.
    diasselect: ['Lunes', 'Martes'],
    dias: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
    horaInicio: null,
    horaFin: null,
    snackNotificationMessage: '',
    tfclave: '',
    materiaResultado: [],
    dialog: false,
    dialogTab: 0,
    picker: false,
    pickedColorBox: null,
    pickedSubject: null,
    snackbar: false,
    showResultado: false,
    days: daysEnum,
    // startTime y endTime indica desde que hora se pinta el timetable
    startTime: new Time(7, 0),
    endTime: new Time(22, 0),
  }),
  computed: {
    ...mapGetters('timetable', ['getActivities', 'isActivityInto']),
  },
  methods: {
    // ...mapMutations('timetable', ['isActivityInto']),
    ...mapActions('timetable', [
      'deleteActivity',
      'addActivity',
      'updateActivities',
    ]),
    leftSchedule(index) {
      const startRow = index + 1; // +1 por el header
      const endRow = startRow + 1;
      return {
        'grid-column': '1/2',
        'grid-row': `${startRow}/${endRow}`,
      };
    },
    daysheader(index) {
      const startCol = index + 1 + 1; // +1 por el header
      const endCol = startCol + 1;
      return {
        'grid-row': '1/2',
        'grid-column': `${startCol}/${endCol}`,
      };
    },
    numberToTime(n) {
      return sumTimes(this.startTime, numToTime(n - 1)).print();
    },
    calculatePosition({ day, start, end }) {
      const timeOffset = substractTimes(start, this.startTime);
      const subjectDuration = substractTimes(end, start);
      const startOffset = timeTonum(timeOffset) + 1 + 1; // +1 por el header
      const endOffset = startOffset + timeTonum(subjectDuration);
      return {
        'grid-column': this.gridColumnDay(day),
        'grid-row': `${startOffset}/${endOffset}`,
      };
    },
    colorBox(materia) {
      return {
        'background-color': materia.extras.color,
      };
    },
    gridColumnDay(day) {
      switch (day) {
        case daysEnum.LUN:
          return '2/3';
        case daysEnum.MAR:
          return '3/4';
        case daysEnum.MIE:
          return '4/5';
        case daysEnum.JUE:
          return '5/6';
        case daysEnum.VIE:
          return '6/7';
        case daysEnum.SAB:
          return '7/8';
        default:
          return '2/3';
      }
    },
    addSubject(grupo) {
      // materiaResultado has all info
      const materia = {
        clave: this.materiaResultado.clave,
        grupo: grupo.numGpo,
        name: this.materiaResultado.materia,
        profesor: grupo.profesor,
        horarios: grupo.horarios,
        extras: { color: 'rgba(255,255,255,0)' },
      };
      if (!this.isActivityInto(materia)) {
        if (!this.overlaps(materia)) {
          this.addActivity(materia);
          this.materiaResultado = [];
          this.dialog = false;
          this.showResultado = false;
          this.snackNotificationMessage = 'Materia agregada';
          this.snackbar = true;
        } else {
          this.snackNotificationMessage = 'La materia se translapa con otras';
          this.snackbar = true;
        }
      } else {
        this.snackNotificationMessage = 'La materia ya se había agregado';
        this.snackbar = true;
      }
    },
    boxesOverlap(h1, h2) {
      if (h1.day === h2.day) {
        if (oneLessThan(substractTimes(h2.start, h1.end), new Time(0, 0))) {
          return true;
        }
      }

      return false;
    },
    overlaps(materia) {
      let overlap = false;
      materia.horarios.forEach((h) => {
        this.getActivities.forEach((m) => {
          let resItOverlap = null;
          if (oneLessThan(h.start, m.end)) {
            resItOverlap = this.boxesOverlap(h, {
              start: m.start,
              end: m.end,
              day: m.day,
            });
          } else {
            resItOverlap = this.boxesOverlap(
              { start: m.start, end: m.end, day: m.day },
              h,
            );
          }
          if (resItOverlap) {
            overlap = true;
          }
        });
      });

      return overlap;
    },
    buscarMateria() {
      if (this.tfclave.length > 2) {
        const resultadoMateria = bd.filter(
          (materia) => parseInt(this.tfclave, 10) === materia.clave,
        );
        if (resultadoMateria.length > 0) {
          console.log('Mostrando grupos');
          // this.dialog = false;
          [this.materiaResultado] = resultadoMateria;
          this.showResultado = true;
        } else {
          this.snackNotificationMessage = 'Materia no encontrada';
          this.snackbar = true;
        }
        this.tfclave = '';
      } else {
        console.log('La clave debe ser mayor de 2 caracteres');
      }
    },
    agregarActividad() {
      if (
        this.diasselect.length === 0 ||
        this.horaInicio === null ||
        this.horaFin === null
      ) {
        this.snackNotificationMessage = 'Revisa los campos';
        this.snackbar = true;
      } else {
        console.log('Vamos bine');
      }
    },
  },
  watch: {
    pickedColorBox(nc) {
      const color = `rgba(${nc.rgba.r},${nc.rgba.g},${nc.rgba.b},${nc.rgba.a})`;
      this.updateActivities({ activity: this.pickedSubject, color });
    },
  },
};