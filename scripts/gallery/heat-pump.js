import { drawing, figure, coil, fan } from './drawing.js';

export function heatPump() {
  const circuit = drawing('refrigerant', 52, 180, 1696, 735);
  circuit.heading('01', 'Follow the refrigerant, not the air', 'Heating mode • the closed circuit carries heat from outdoor air to the room.');
  circuit.rect(28, 122, 535, 403, '#102c3e', '$line', 14);
  circuit.rect(1133, 122, 535, 403, '#192f3c', '$line', 14);
  circuit.label('OUTDOOR UNIT', 54, 140, 270);
  circuit.label('INDOOR UNIT', 1160, 140, 270, '$accent');
  circuit.text('Colder refrigerant absorbs heat', 54, 170, 470, 23);
  circuit.text('Hotter refrigerant releases heat', 1160, 170, 475, 23);

  coil(circuit, 220, 260, 160, 200, '$secondary');
  fan(circuit, 465, 354, 56);
  coil(circuit, 1380, 260, 160, 200, '$accent');
  fan(circuit, 1240, 354, 56);
  circuit.label('EVAPORATOR', 272, 484, 200);
  circuit.label('CONDENSER', 1440, 484, 215, '$accent');
  for (const y of [305, 355, 405]) {
    circuit.arrow(66, y, 184, y, '$warm', 4);
    circuit.arrow(1555, y, 1640, y, '$accent', 4);
  }
  circuit.text('HEAT IN', 59, 436, 140, 18, '$warm', 'semibold');
  circuit.text('HEAT OUT', 1545, 436, 120, 18, '$accent', 'semibold');

  // Each pipe joins an actual coil port. Arrowheads express refrigerant flow.
  circuit.route([[234, 260], [234, 223], [770, 223]], '$secondary', 5);
  circuit.route([[900, 223], [1394, 223], [1394, 260]], '$accent', 5);
  circuit.circle(835, 223, 65, '$panel', '$warm', 3);
  circuit.polygon([[800, 254], [800, 192], [867, 223]], 'none', '$warm', 3);
  circuit.text('COMPRESSOR', 705, 316, 260, 22, '$warm', 'semibold', { align: 'center' });
  circuit.text('Electrical work raises\npressure and temperature.', 650, 355, 370, 23, '$muted', 'regular', { align: 'center' });
  circuit.arrow(835, 121, 835, 155, '$warm', 4);
  circuit.label('WORK IN', 738, 85, 200, '$warm');
  circuit.label('LOW-PRESSURE VAPOUR', 594, 262, 300);
  circuit.label('HIGH-PRESSURE VAPOUR', 921, 262, 320, '$accent');

  circuit.route([[1394, 448], [1394, 563], [875, 563]], '$accent', 5);
  circuit.route([[795, 563], [234, 563], [234, 448]], '$secondary', 5);
  circuit.polygon([[795, 542], [835, 563], [795, 584]], '$panel', '$warm', 3);
  circuit.polygon([[875, 542], [835, 563], [875, 584]], '$panel', '$warm', 3);
  circuit.text('EXPANSION VALVE', 676, 605, 320, 22, '$warm', 'semibold', { align: 'center' });
  circuit.text('Pressure falls; some liquid flashes to vapour.', 590, 642, 490, 22, '$muted', 'regular', { align: 'center' });
  circuit.label('COLD LIQUID + VAPOUR', 288, 585, 310);
  circuit.label('HIGH-PRESSURE LIQUID', 1068, 585, 315, '$accent');
  circuit.text('Evaporation takes energy from the air.', 56, 645, 445, 23, '$muted');
  circuit.text('Condensation gives energy to the room.', 1160, 645, 465, 23, '$muted');

  const energy = drawing('energy-balance', 52, 974, 800, 475);
  energy.heading('02', 'More heat than electrical input', 'A worked balance • illustrative operating point, not a product rating.');
  energy.rect(308, 137, 175, 196, '$panel', '$line', 12);
  energy.text('HEAT\nPUMP', 333, 191, 125, 25, '$ink', 'semibold', { align: 'center' });
  const outdoorKW = 2, electricalKW = 1, deliveredKW = outdoorKW + electricalKW, pixelsPerKW = 21;
  energy.ribbon(28, 179, 262, outdoorKW * pixelsPerKW, '$secondary');
  energy.ribbon(28, 290, 262, electricalKW * pixelsPerKW, '$warm');
  energy.ribbon(500, 230, 269, deliveredKW * pixelsPerKW, '$accent');
  energy.text('2 kW • outdoor heat', 28, 117, 260, 23, '$secondary', 'semibold');
  energy.text('1 kW • electricity', 28, 336, 275, 23, '$warm', 'semibold');
  energy.text('3 kW • indoor heat', 516, 142, 275, 23, '$accent', 'semibold');
  energy.text('3 = 2 + 1', 512, 288, 275, 29, '$ink', 'semibold');
  energy.line(0, 393, 800, 393);
  energy.text('COP = delivered heat / electrical input = 3', 0, 415, 800, 24, '$ink', 'semibold');

  const control = drawing('control-loop', 930, 974, 818, 475);
  control.heading('03', 'The thermostat closes another loop', 'Refrigerant transfers heat; the control signal regulates demand.');
  control.rect(0, 123, 818, 221, '$panel', '$line', 12);
  control.text('ROOM', 25, 143, 140, 18, '$secondary', 'semibold');
  control.rect(27, 190, 148, 84, '$background', '$secondary', 8);
  control.text('T < target', 41, 209, 125, 23);
  control.arrow(188, 232, 273, 232, '$warm', 3);
  control.text('Heat demand', 191, 150, 154, 19, '$warm');
  control.rect(289, 190, 167, 84, '$background', '$warm', 8);
  control.text('Controller', 310, 209, 128, 23);
  control.arrow(469, 232, 548, 232, '$warm', 3);
  control.rect(564, 190, 224, 84, '$background', '$accent', 8);
  control.text('Heat to the room', 579, 209, 198, 23);
  control.route([[676, 286], [676, 314], [100, 314], [100, 280]], '$secondary', 3);
  control.text('Room temperature is measured again', 164, 354, 580, 23, '$muted');
  control.text('Real control may modulate output or cycle equipment.\nDefrost and reversing valves are omitted from the circuit.', 0, 410, 818, 21, '$muted');

  return figure('How a heat pump warms a room', 'A phase-changing fluid moves heat uphill in temperature. Electricity drives the transfer; feedback controls the demand.', 'FIELD ATLAS    /    01 — HEAT & CONTROL', 1540, [
    { title: 'U.S. DOE — Energy Renovations: HVAC, air-source heat pump heating cycle', url: 'https://www1.eere.energy.gov/buildings/publications/pdfs/building_america/hvac_guide.pdf' },
    { title: 'DOE / NREL — Decarbonizing Building Thermal Systems', url: 'https://betterbuildingssolutioncenter.energy.gov/sites/default/files/attachments/87812.pdf' },
    { title: 'DOE — Programmable Thermostats', url: 'https://bsesc.energy.gov/energy-basics/hvac-programmable-thermostats' }
  ], [circuit, energy, control], 'Sources: U.S. DOE / NREL • Heating mode; simplified circuit • Energy figures are a worked example • Geometry is not to scale');
}
