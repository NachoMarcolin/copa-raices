(function () {
  const KEY = 'copaRaicesDataV1';

  const seed = {
    version: 1,
    activeSport: 'football',
    sports: {
      football: {
        label: 'Fútbol',
        teams: [
          { id: 'sol', name: 'Sol de Mayo', short: 'SM', group: 'A' },
          { id: 'sur', name: 'Unión del Sur', short: 'US', group: 'A' },
          { id: 'pampa', name: 'Pampa FC', short: 'PF', group: 'A' },
          { id: 'barrio', name: 'Barrio Norte', short: 'BN', group: 'A' }
        ],
        matches: [
          {
            id: 'f1', date: '2026-12-18', time: '14:00', court: 'Cancha 1', group: 'Grupo A',
            homeId: 'sol', awayId: 'sur', homeName: 'Sol de Mayo', awayName: 'Unión del Sur',
            homeScore: 1, awayScore: 0, status: 'live', period: '1T', elapsedSeconds: 754,
            clockRunning: false, startedAt: null,
            events: [
              { id: 101, minute: 8, type: 'goal', team: 'Sol de Mayo', player: 'Tomás Roldán' }
            ]
          },
          {
            id: 'f2', date: '2026-12-18', time: '15:00', court: 'Cancha 2', group: 'Grupo A',
            homeId: 'pampa', awayId: 'barrio', homeName: 'Pampa FC', awayName: 'Barrio Norte',
            homeScore: 0, awayScore: 0, status: 'scheduled', period: '1T', elapsedSeconds: 0,
            clockRunning: false, startedAt: null, events: []
          },
          {
            id: 'f3', date: '2026-12-18', time: '16:00', court: 'Cancha 1', group: 'Grupo A',
            homeId: 'sol', awayId: 'pampa', homeName: 'Sol de Mayo', awayName: 'Pampa FC',
            homeScore: 2, awayScore: 1, status: 'finished', period: '2T', elapsedSeconds: 2400,
            clockRunning: false, startedAt: null,
            events: [
              { id: 102, minute: 6, type: 'goal', team: 'Sol de Mayo', player: 'Tomás Roldán' },
              { id: 103, minute: 18, type: 'goal', team: 'Pampa FC', player: 'Lautaro Paz' },
              { id: 104, minute: 31, type: 'goal', team: 'Sol de Mayo', player: 'Mateo Sosa' }
            ]
          },
          {
            id: 'f4', date: '2026-12-18', time: '17:00', court: 'Cancha 2', group: 'Grupo A',
            homeId: 'sur', awayId: 'barrio', homeName: 'Unión del Sur', awayName: 'Barrio Norte',
            homeScore: 1, awayScore: 1, status: 'finished', period: '2T', elapsedSeconds: 2400,
            clockRunning: false, startedAt: null,
            events: [
              { id: 105, minute: 13, type: 'goal', team: 'Barrio Norte', player: 'Franco Gómez' },
              { id: 106, minute: 29, type: 'goal', team: 'Unión del Sur', player: 'Nicolás Vega' }
            ]
          }
        ]
      },
      padel: {
        label: 'Pádel',
        teams: [
          { id: 'dupla1', name: 'Gómez / Ruiz', short: 'GR', group: 'Zona Única' },
          { id: 'dupla2', name: 'Paz / León', short: 'PL', group: 'Zona Única' },
          { id: 'dupla3', name: 'Sosa / Vidal', short: 'SV', group: 'Zona Única' },
          { id: 'dupla4', name: 'Mora / Díaz', short: 'MD', group: 'Zona Única' }
        ],
        matches: [
          {
            id: 'p1', date: '2026-12-18', time: '14:30', court: 'Pista 1', group: 'Zona Única',
            homeId: 'dupla1', awayId: 'dupla2', homeName: 'Gómez / Ruiz', awayName: 'Paz / León',
            homeScore: 6, awayScore: 4, status: 'finished', period: 'SET 1', elapsedSeconds: 0,
            clockRunning: false, startedAt: null, events: []
          },
          {
            id: 'p2', date: '2026-12-18', time: '15:30', court: 'Pista 2', group: 'Zona Única',
            homeId: 'dupla3', awayId: 'dupla4', homeName: 'Sosa / Vidal', awayName: 'Mora / Díaz',
            homeScore: 0, awayScore: 0, status: 'scheduled', period: 'SET 1', elapsedSeconds: 0,
            clockRunning: false, startedAt: null, events: []
          }
        ]
      }
    }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function load() {
    const saved = localStorage.getItem(KEY);
    if (!saved) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      return clone(seed);
    }
    try { return JSON.parse(saved); }
    catch (_) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      return clone(seed);
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('copa-raices:update'));
  }

  function reset() {
    localStorage.setItem(KEY, JSON.stringify(seed));
    window.dispatchEvent(new CustomEvent('copa-raices:update'));
    return clone(seed);
  }

  function getElapsed(match) {
    if (!match.clockRunning || !match.startedAt) return Number(match.elapsedSeconds || 0);
    const extra = Math.max(0, Math.floor((Date.now() - match.startedAt) / 1000));
    return Number(match.elapsedSeconds || 0) + extra;
  }

  function formatClock(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function initials(name) {
    return name.split(/[\s/]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  window.CopaRaicesStore = { KEY, seed, load, save, reset, getElapsed, formatClock, initials };
})();
