<template>
  <v-container fluid>
    <!-- snackNotificationMessage snackbar component -->
    <v-snackbar v-model="snackbar">
      {{ snackNotificationMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn color="blue" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <!-- Floating button -->
    <v-btn
      absolute
      fixed
      dark
      fab
      bottom
      right
      color="blue"
      class="mb-10 d-print-none"
      @click="dialog = true"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    <!-- Dialog for floating button -->
    <v-dialog v-model="dialog" width="900px">
      <v-card>
        <v-card-title>
          <v-spacer></v-spacer>
          <v-btn color="blue" text @click="dialog = false">Cerrar</v-btn>
          <v-tabs v-model="dialogTab">
            <v-tab>Materias FI</v-tab>
            <v-tab>Otras actividades</v-tab>
          </v-tabs>
        </v-card-title>
        <v-card-text v-if="dialogTab === 0">
          <div>
            <v-text-field
              label="Clave de la materia"
              required
              class="d-inline-flex mr-2"
              v-model="tfclave"
              v-on:keyup.enter="buscarMateria"
            ></v-text-field>
            <v-btn
              outlined
              rounded
              color="primary"
              class="d-inline-flex"
              @click="buscarMateria"
              >Buscar</v-btn
            >
          </div>
          <div v-if="showResultado">
            <div class="mt-2 mb-4">
              <h3>
                {{ materiaResultado.materia }} ({{ materiaResultado.clave }})
              </h3>
            </div>
            <v-card>
              <v-list two-line flat>
                <v-list-item-group>
                  <template v-for="(grupo, index) in materiaResultado.grupos">
                    <v-list-item :key="`gpo-${grupo.numGpo}`">
                      <template>
                        <v-list-item-content>
                          <v-list-item-title
                            v-text="grupo.profesor"
                          ></v-list-item-title>
                          <!-- <v-list-item-subtitle
                          class="text--primary"
                          v-text="item.headline"
                        ></v-list-item-subtitle> -->
                          <v-list-item-subtitle
                            v-for="(horario, index) in grupo.horarios"
                            v-text="
                              `${
                                horario.day
                              } ${horario.start.print()} - ${horario.end.print()}`
                            "
                            :key="`h-${index}`"
                          ></v-list-item-subtitle>
                        </v-list-item-content>

                        <v-list-item-action>
                          <v-list-item-action-text
                            v-text="`Gpo: ${grupo.numGpo}`"
                          ></v-list-item-action-text>
                          <v-btn
                            rounded
                            outlined
                            color="success"
                            fab
                            small
                            @click="addSubject(grupo)"
                            ><v-icon>mdi-plus</v-icon></v-btn
                          >
                        </v-list-item-action>
                      </template>
                    </v-list-item>

                    <v-divider
                      v-if="index + 1 < materiaResultado.grupos.length"
                      :key="index"
                    ></v-divider>
                  </template>
                </v-list-item-group>
              </v-list>
            </v-card>
          </div>
        </v-card-text>
        <v-card-text v-if="dialogTab === 1">
          <v-row>
            <v-col md="6" sm="12">
              <v-text-field label="Id actividad" required></v-text-field>
              <v-text-field label="Nombre actividad" required></v-text-field>
              <v-text-field label="Grupo"></v-text-field>
              <v-text-field label="Profesor"></v-text-field>
            </v-col>
            <v-col md="6" sm="12" class="text-center">
              <v-combobox
                v-model="diasselect"
                :items="dias"
                label="Horario"
                multiple
                chips
              >
                <template v-slot:selection="data">
                  <v-chip
                    :key="JSON.stringify(data.item)"
                    v-bind="data.attrs"
                    :input-value="data.selected"
                    :disabled="data.disabled"
                    @click:close="data.parent.selectItem(data.item)"
                  >
                    <v-avatar
                      class="accent white--text"
                      left
                      v-text="data.item.slice(0, 1).toUpperCase()"
                    ></v-avatar>
                    {{ data.item }}
                  </v-chip>
                </template>
              </v-combobox>
              <div>Hora inicio</div>
              <v-time-picker
                v-model="horaInicio"
                landscape
                width="180"
                class="mb-5"
              ></v-time-picker>
              <div>Hora fin</div>
              <v-time-picker
                v-model="horaFin"
                landscape
                width="180"
              ></v-time-picker>
            </v-col>
            <v-col md="12" sm="12">
              <v-btn
                class="ma-2"
                outlined
                color="indigo"
                @click="agregarActividad"
                >Agregar</v-btn
              >
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="picker" max-width="290">
      <v-color-picker elevation="15" v-model="pickedColorBox"></v-color-picker>
    </v-dialog>
    <v-row>
      <v-col md="12" sm="12" class="pt-0">
        <div class="wrapper">
          <div class="horario-header">Horario</div>
          <div
            v-for="(day, i, index) in days"
            :key="i"
            :style="daysheader(index)"
            class="days"
          >
            {{ day }}
          </div>
          <!-- hardcode '60', replace in future versions -->
          <div
            v-for="n in 60 + 1"
            :key="n"
            :style="leftSchedule(n)"
            class="left-schedule"
          >
            {{ numberToTime(n) }}
          </div>
          <div
            class="subject"
            v-for="(materia, i) in getActivities"
            :key="`materia-${i}`"
            :style="[calculatePosition(materia), colorBox(materia)]"
          >
            <div class="subject-container">
              <div>{{ materia.clave }}</div>
              <div>Gpo {{ materia.grupo }}</div>
              <div>
                <b>{{ materia.name }}</b>
              </div>
              <div>{{ materia.profesor }}</div>
              <div>
                <!-- <v-btn icon color="danger" @click="pickColor(materia)"> -->
                <v-btn
                  icon
                  color="danger"
                  @click="
                    picker = true;
                    pickedSubject = materia;
                  "
                >
                  <v-icon>mdi-palette</v-icon>
                </v-btn>
                <v-btn icon color="danger" @click="deleteActivity(materia)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script src= "../scripts/Home.js"></script>

<style src= "../css/Home.css"></style>
