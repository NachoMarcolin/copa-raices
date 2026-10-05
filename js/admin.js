// ======================================================
// COPA RAÍCES - ADMIN
// SIN INICIO DE SESIÓN
// ======================================================


let adminTeams = [];
let adminMatches = [];
let adminEvents = [];

let selectedMatchId = null;

let clockInterval = null;


// ======================================================
// INICIO
// ======================================================


document.addEventListener(
  "DOMContentLoaded",
  initAdmin
);


async function initAdmin() {

  setupNavigation();

  setupControlEvents();

  setupMatchEvents();

  setupTeamEvents();

  await loadEverything();

}


// ======================================================
// NAVEGACIÓN
// ======================================================


function setupNavigation() {

  document
    .querySelectorAll(
      "[data-admin-section]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openAdminSection(
            button.dataset.adminSection
          );

        }
      );

    });

}


function openAdminSection(section) {

  document
    .querySelectorAll(
      ".admin-section"
    )
    .forEach(item => {

      item.classList.remove(
        "active"
      );

    });


  document
    .querySelectorAll(
      ".admin-nav-button"
    )
    .forEach(button => {

      button.classList.toggle(

        "active",

        button.dataset.adminSection ===
          section

      );

    });


  const sectionElement =
    document.getElementById(
      `admin-${section}`
    );


  if (sectionElement) {

    sectionElement.classList.add(
      "active"
    );

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ======================================================
// CARGAR TODO
// ======================================================


async function loadEverything() {

  await loadTeams();

  await loadMatches();

  await loadEvents();

  renderAll();

}


// ======================================================
// EQUIPOS
// ======================================================


async function loadTeams() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("teams")
      .select("*")
      .order(
        "name",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Error cargando equipos:",
      error
    );

    return;

  }


  adminTeams =
    data || [];

}


// ======================================================
// PARTIDOS
// ======================================================


async function loadMatches() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("matches")
      .select("*")
      .order(
        "match_date",
        {
          ascending: true,
          nullsFirst: false
        }
      )
      .order(
        "start_time",
        {
          ascending: true,
          nullsFirst: false
        }
      );


  if (error) {

    console.error(
      "Error cargando partidos:",
      error
    );

    return;

  }


  adminMatches =
    data || [];


  if (
    !selectedMatchId &&
    adminMatches.length
  ) {

    selectedMatchId =
      adminMatches[0].id;

  }


  if (
    selectedMatchId &&
    !adminMatches.some(
      match =>
        Number(match.id) ===
        Number(selectedMatchId)
    )
  ) {

    selectedMatchId =
      adminMatches[0]?.id ||
      null;

  }

}


// ======================================================
// EVENTOS
// ======================================================


async function loadEvents() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("match_events")
      .select("*")
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Error cargando eventos:",
      error
    );

    return;

  }


  adminEvents =
    data || [];

}


// ======================================================
// HELPERS
// ======================================================


function getTeam(id) {

  return adminTeams.find(
    team =>
      Number(team.id) ===
      Number(id)
  );

}


function teamName(id) {

  return getTeam(id)?.name ||
    "Equipo";

}


function currentMatch() {

  return adminMatches.find(
    match =>
      Number(match.id) ===
      Number(selectedMatchId)
  );

}


function formatClock(seconds) {

  const mins =
    Math.floor(
      seconds / 60
    );


  const secs =
    seconds % 60;


  return (
    String(mins).padStart(2, "0")
    +
    ":"
    +
    String(secs).padStart(2, "0")
  );

}


function getLiveSeconds(match) {

  if (!match) {

    return 0;

  }


  let total =
    Number(
      match.elapsed_seconds ||
      0
    );


  if (
    match.clock_running &&
    match.clock_started_at
  ) {

    const start =
      new Date(
        match.clock_started_at
      ).getTime();


    const now =
      Date.now();


    total +=
      Math.max(
        0,
        Math.floor(
          (now - start) /
          1000
        )
      );

  }


  return total;

}


function eventIcon(type) {

  switch (type) {

    case "goal":
      return "⚽";

    case "yellow":
      return "🟨";

    case "red":
      return "🟥";

    case "point":
      return "🎾";

    default:
      return "•";

  }

}


// ======================================================
// RENDER GENERAL
// ======================================================


function renderAll() {

  renderMatchSelector();

  renderControl();

  renderMatchesList();

  renderTeamsList();

  refreshCreateTeamSelectors();

}


// ======================================================
// SELECTOR DE PARTIDO
// ======================================================


function renderMatchSelector() {

  const sportSelect =
    document.getElementById(
      "controlSport"
    );


  const select =
    document.getElementById(
      "matchSelector"
    );


  if (
    !sportSelect ||
    !select
  ) {

    return;

  }


  const sport =
    sportSelect.value;


  const filtered =
    adminMatches.filter(
      match =>
        match.sport === sport
    );


  select.innerHTML = "";


  if (!filtered.length) {

    const option =
      document.createElement(
        "option"
      );


    option.textContent =
      "No hay partidos";


    option.value =
      "";


    select.appendChild(
      option
    );


    selectedMatchId =
      null;


    return;

  }


  const selectedExists =
    filtered.some(
      match =>
        Number(match.id) ===
        Number(selectedMatchId)
    );


  if (!selectedExists) {

    selectedMatchId =
      filtered[0].id;

  }


  filtered.forEach(match => {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      match.id;


    const time =
      match.start_time
        ?.slice(0, 5) ||
      "--:--";


    option.textContent =
      `${time} · ${teamName(match.home_team_id)} vs ${teamName(match.away_team_id)}`;


    if (
      Number(match.id) ===
      Number(selectedMatchId)
    ) {

      option.selected =
        true;

    }


    select.appendChild(
      option
    );

  });

}


// ======================================================
// PANEL DE CONTROL
// ======================================================


function renderControl() {

  const match =
    currentMatch();


  stopClockInterval();


  const panel =
    document.getElementById(
      "controlPanel"
    );


  if (!panel) {

    return;

  }


  if (!match) {

    panel.style.display =
      "none";

    return;

  }


  panel.style.display =
    "block";


  document
    .getElementById(
      "adminHomeName"
    )
    .textContent =
      teamName(
        match.home_team_id
      );


  document
    .getElementById(
      "adminAwayName"
    )
    .textContent =
      teamName(
        match.away_team_id
      );


  document
    .getElementById(
      "adminHomeScore"
    )
    .textContent =
      match.home_score || 0;


  document
    .getElementById(
      "adminAwayScore"
    )
    .textContent =
      match.away_score || 0;


  document
    .getElementById(
      "adminMatchCourt"
    )
    .textContent =
      `${match.court || "Sin cancha"}${match.group_name ? " · " + match.group_name : ""}`;


  renderStatus(
    match
  );


  renderPeriodButtons(
    match
  );


  fillMatchForm(
    match
  );


  fillEventTeams(
    match
  );


  renderAdminEvents(
    match
  );


  updateClockDisplay(
    match
  );


  if (
    match.clock_running
  ) {

    startClockInterval();

  }

}


// ======================================================
// ESTADO
// ======================================================


function renderStatus(match) {

  const badge =
    document.getElementById(
      "adminMatchStatus"
    );


  if (!badge) {

    return;

  }


  badge.className =
    "admin-status-badge";


  if (
    match.status ===
    "finished"
  ) {

    badge.textContent =
      "FINAL";


    badge.classList.add(
      "finished"
    );

  }

  else if (
    match.status ===
    "live"
  ) {

    badge.textContent =
      "EN VIVO";


    badge.classList.add(
      "live"
    );

  }

  else {

    badge.textContent =
      "PENDIENTE";

  }

}


// ======================================================
// RELOJ
// ======================================================


function updateClockDisplay(match) {

  const seconds =
    getLiveSeconds(
      match
    );


  const clock =
    document.getElementById(
      "adminClock"
    );


  if (clock) {

    clock.textContent =
      formatClock(
        seconds
      );

  }


  const minuteInput =
    document.getElementById(
      "eventMinute"
    );


  if (
    minuteInput &&
    document.activeElement !==
      minuteInput
  ) {

    minuteInput.value =
      Math.floor(
        seconds / 60
      );

  }

}


function startClockInterval() {

  stopClockInterval();


  clockInterval =
    setInterval(
      () => {

        const match =
          currentMatch();


        if (match) {

          updateClockDisplay(
            match
          );

        }

      },
      1000
    );

}


function stopClockInterval() {

  if (clockInterval) {

    clearInterval(
      clockInterval
    );


    clockInterval =
      null;

  }

}


// ======================================================
// PERÍODOS
// ======================================================


function renderPeriodButtons(match) {

  const container =
    document.getElementById(
      "periodButtons"
    );


  if (!container) {

    return;

  }


  const periods =
    match.sport ===
      "padel"

      ?

      [
        "SET 1",
        "SET 2",
        "SET 3"
      ]

      :

      [
        "1T",
        "ENTRETIEMPO",
        "2T"
      ];


  container.innerHTML =
    "";


  periods.forEach(period => {

    const button =
      document.createElement(
        "button"
      );


    button.className =
      "admin-period-button";


    if (
      match.period ===
      period
    ) {

      button.classList.add(
        "active"
      );

    }


    button.textContent =
      period;


    button.addEventListener(
      "click",
      async () => {

        await updateMatch({
          period
        });

      }
    );


    container.appendChild(
      button
    );

  });

}


// ======================================================
// FORMULARIO PARTIDO
// ======================================================


function fillMatchForm(match) {

  fillTeamSelect(
    "editHomeTeam",
    match.sport,
    match.home_team_id
  );


  fillTeamSelect(
    "editAwayTeam",
    match.sport,
    match.away_team_id
  );


  document
    .getElementById(
      "editCourt"
    )
    .value =
      match.court || "";


  document
    .getElementById(
      "editGroup"
    )
    .value =
      match.group_name || "";


  document
    .getElementById(
      "editRound"
    )
    .value =
      match.round_name || "";


  document
    .getElementById(
      "editDate"
    )
    .value =
      match.match_date || "";


  document
    .getElementById(
      "editTime"
    )
    .value =
      match.start_time
        ?.slice(0, 5) ||
      "";

}


// ======================================================
// SELECTORES DE EQUIPO
// ======================================================


function fillTeamSelect(
  elementId,
  sport,
  selectedId = null
) {

  const select =
    document.getElementById(
      elementId
    );


  if (!select) {

    return;

  }


  select.innerHTML =
    "";


  const filtered =
    adminTeams.filter(
      team =>
        team.sport ===
        sport
    );


  if (!filtered.length) {

    const option =
      document.createElement(
        "option"
      );


    option.textContent =
      "No hay equipos";


    option.value =
      "";


    select.appendChild(
      option
    );


    return;

  }


  filtered.forEach(team => {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      team.id;


    option.textContent =
      team.name;


    if (
      Number(team.id) ===
      Number(selectedId)
    ) {

      option.selected =
        true;

    }


    select.appendChild(
      option
    );

  });

}


// ======================================================
// EQUIPOS PARA EVENTOS
// ======================================================


function fillEventTeams(match) {

  const select =
    document.getElementById(
      "eventTeam"
    );


  if (!select) {

    return;

  }


  select.innerHTML =
    "";


  [
    match.home_team_id,
    match.away_team_id
  ]
  .forEach(id => {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      id;


    option.textContent =
      teamName(id);


    select.appendChild(
      option
    );

  });

}


// ======================================================
// EVENTOS DE CONTROLES
// ======================================================


function setupControlEvents() {

  const controlSport =
    document.getElementById(
      "controlSport"
    );


  if (controlSport) {

    controlSport.addEventListener(
      "change",
      () => {

        selectedMatchId =
          null;


        renderMatchSelector();

        renderControl();

      }
    );

  }


  const matchSelector =
    document.getElementById(
      "matchSelector"
    );


  if (matchSelector) {

    matchSelector.addEventListener(
      "change",
      event => {

        selectedMatchId =
          Number(
            event.target.value
          );


        renderControl();

      }
    );

  }


  scoreButton(
    "homePlus",
    "home",
    1
  );


  scoreButton(
    "homeMinus",
    "home",
    -1
  );


  scoreButton(
    "awayPlus",
    "away",
    1
  );


  scoreButton(
    "awayMinus",
    "away",
    -1
  );


  const start =
    document.getElementById(
      "startClock"
    );


  if (start) {

    start.addEventListener(
      "click",
      startClock
    );

  }


  const pause =
    document.getElementById(
      "pauseClock"
    );


  if (pause) {

    pause.addEventListener(
      "click",
      pauseClock
    );

  }


  const reset =
    document.getElementById(
      "resetClock"
    );


  if (reset) {

    reset.addEventListener(
      "click",
      resetClock
    );

  }


  const save =
    document.getElementById(
      "saveMatchInfo"
    );


  if (save) {

    save.addEventListener(
      "click",
      saveMatchInfo
    );

  }


  const addEvent =
    document.getElementById(
      "addEventButton"
    );


  if (addEvent) {

    addEvent.addEventListener(
      "click",
      createEvent
    );

  }


  const finish =
    document.getElementById(
      "finishMatchButton"
    );


  if (finish) {

    finish.addEventListener(
      "click",
      finishMatch
    );

  }


  const reopen =
    document.getElementById(
      "reopenMatchButton"
    );


  if (reopen) {

    reopen.addEventListener(
      "click",
      reopenMatch
    );

  }

}


// ======================================================
// MARCADOR
// ======================================================


function scoreButton(
  id,
  side,
  amount
) {

  const button =
    document.getElementById(
      id
    );


  if (!button) {

    return;

  }


  button.addEventListener(
    "click",
    async () => {

      const match =
        currentMatch();


      if (!match) {

        return;

      }


      const field =
        side === "home"

          ? "home_score"

          : "away_score";


      const value =
        Math.max(

          0,

          Number(
            match[field] ||
            0
          )
          +
          amount

        );


      await updateMatch({
        [field]: value
      });

    }
  );

}


// ======================================================
// ACTUALIZAR PARTIDO
// ======================================================


async function updateMatch(
  changes
) {

  const match =
    currentMatch();


  if (!match) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("matches")
      .update(
        changes
      )
      .eq(
        "id",
        match.id
      );


  if (error) {

    console.error(
      "Error actualizando partido:",
      error
    );


    alert(
      "No se pudo actualizar el partido."
    );


    return;

  }


  await loadMatches();

  renderAll();

}


// ======================================================
// INICIAR RELOJ
// ======================================================


async function startClock() {

  const match =
    currentMatch();


  if (!match) {

    return;

  }


  if (
    match.clock_running
  ) {

    return;

  }


  await updateMatch({

    status:
      "live",

    clock_running:
      true,

    clock_started_at:
      new Date()
        .toISOString()

  });

}


// ======================================================
// PAUSAR RELOJ
// ======================================================


async function pauseClock() {

  const match =
    currentMatch();


  if (!match) {

    return;

  }


  const seconds =
    getLiveSeconds(
      match
    );


  await updateMatch({

    elapsed_seconds:
      seconds,

    clock_running:
      false,

    clock_started_at:
      null

  });

}


// ======================================================
// REINICIAR RELOJ
// ======================================================


async function resetClock() {

  const confirmed =
    confirm(
      "¿Reiniciar el reloj a 00:00?"
    );


  if (!confirmed) {

    return;

  }


  await updateMatch({

    elapsed_seconds:
      0,

    clock_running:
      false,

    clock_started_at:
      null

  });

}


// ======================================================
// GUARDAR DATOS DEL PARTIDO
// ======================================================


async function saveMatchInfo() {

  const match =
    currentMatch();


  if (!match) {

    return;

  }


  const home =
    Number(
      document
        .getElementById(
          "editHomeTeam"
        )
        .value
    );


  const away =
    Number(
      document
        .getElementById(
          "editAwayTeam"
        )
        .value
    );


  if (
    !home ||
    !away
  ) {

    alert(
      "Seleccioná local y visitante."
    );

    return;

  }


  if (
    home === away
  ) {

    alert(
      "Local y visitante no pueden ser el mismo equipo."
    );

    return;

  }


  await updateMatch({

    home_team_id:
      home,

    away_team_id:
      away,

    court:
      document
        .getElementById(
          "editCourt"
        )
        .value
        .trim(),

    group_name:
      document
        .getElementById(
          "editGroup"
        )
        .value
        .trim(),

    round_name:
      document
        .getElementById(
          "editRound"
        )
        .value
        .trim(),

    match_date:
      document
        .getElementById(
          "editDate"
        )
        .value ||
      null,

    start_time:
      document
        .getElementById(
          "editTime"
        )
        .value ||
      null

  });

}


// ======================================================
// CREAR EVENTO
// ======================================================


async function createEvent() {

  const match =
    currentMatch();


  if (!match) {

    return;

  }


  const type =
    document
      .getElementById(
        "eventType"
      )
      .value;


  const teamId =
    Number(
      document
        .getElementById(
          "eventTeam"
        )
        .value
    );


  const player =
    document
      .getElementById(
        "eventPlayer"
      )
      .value
      .trim();


  const minute =
    Number(
      document
        .getElementById(
          "eventMinute"
        )
        .value
    ) || 0;


  if (!teamId) {

    alert(
      "Seleccioná un equipo."
    );

    return;

  }


  if (
    type !== "point" &&
    !player
  ) {

    alert(
      "Ingresá el nombre del jugador."
    );

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from(
        "match_events"
      )
      .insert({

        match_id:
          match.id,

        team_id:
          teamId,

        player_name:
          player,

        event_type:
          type,

        minute

      });


  if (error) {

    console.error(
      "Error creando evento:",
      error
    );


    alert(
      "No se pudo crear el evento."
    );


    return;

  }


  // Si es gol, sumar automáticamente.

  if (
    type === "goal"
  ) {

    const field =
      Number(teamId) ===
      Number(
        match.home_team_id
      )

        ? "home_score"

        : "away_score";


    const newScore =
      Number(
        match[field] ||
        0
      ) + 1;


    const {
      error: scoreError
    } =
      await supabaseClient
        .from("matches")
        .update({
          [field]:
            newScore
        })
        .eq(
          "id",
          match.id
        );


    if (scoreError) {

      console.error(
        "Error actualizando marcador:",
        scoreError
      );

    }

  }


  document
    .getElementById(
      "eventPlayer"
    )
    .value =
      "";


  await loadEverything();

}


// ======================================================
// MOSTRAR EVENTOS
// ======================================================


function renderAdminEvents(match) {

  const container =
    document.getElementById(
      "adminEventsList"
    );


  if (!container) {

    return;

  }


  const list =
    adminEvents
      .filter(
        event =>
          Number(
            event.match_id
          ) ===
          Number(
            match.id
          )
      )
      .sort(
        (a, b) =>
          Number(b.minute) -
          Number(a.minute)
      );


  if (!list.length) {

    container.innerHTML = `

      <div class="admin-empty">
        No hay eventos cargados.
      </div>

    `;

    return;

  }


  container.innerHTML =
    "";


  list.forEach(event => {

    const item =
      document.createElement(
        "div"
      );


    item.className =
      "admin-event-row";


    item.innerHTML = `

      <div class="admin-event-icon">

        ${eventIcon(
          event.event_type
        )}

      </div>


      <div class="admin-event-info">

        <strong>

          ${event.player_name || "Evento"}

        </strong>


        <span>

          ${teamName(
            event.team_id
          )}

          ·

          ${event.minute}'

        </span>

      </div>


      <button
        class="admin-delete-small"
      >
        Eliminar
      </button>

    `;


    item
      .querySelector(
        "button"
      )
      .addEventListener(
        "click",
        () => {

          deleteEvent(
            event
          );

        }
      );


    container.appendChild(
      item
    );

  });

}


// ======================================================
// ELIMINAR EVENTO
// ======================================================


async function deleteEvent(event) {

  const confirmed =
    confirm(
      "¿Eliminar este evento?"
    );


  if (!confirmed) {

    return;

  }


  const match =
    currentMatch();


  const {
    error
  } =
    await supabaseClient
      .from(
        "match_events"
      )
      .delete()
      .eq(
        "id",
        event.id
      );


  if (error) {

    console.error(
      "Error eliminando evento:",
      error
    );


    return;

  }


  // Si era gol, restarlo.

  if (
    event.event_type ===
      "goal" &&
    match
  ) {

    const field =
      Number(
        event.team_id
      ) ===
      Number(
        match.home_team_id
      )

        ? "home_score"

        : "away_score";


    const newScore =
      Math.max(

        0,

        Number(
          match[field] ||
          0
        ) - 1

      );


    await supabaseClient
      .from("matches")
      .update({
        [field]:
          newScore
      })
      .eq(
        "id",
        match.id
      );

  }


  await loadEverything();

}


// ======================================================
// FINALIZAR PARTIDO
// ======================================================


async function finishMatch() {

  const confirmed =
    confirm(
      "¿Finalizar el partido?"
    );


  if (!confirmed) {

    return;

  }


  const match =
    currentMatch();


  if (!match) {

    return;

  }


  const seconds =
    getLiveSeconds(
      match
    );


  await updateMatch({

    status:
      "finished",

    elapsed_seconds:
      seconds,

    clock_running:
      false,

    clock_started_at:
      null

  });

}


// ======================================================
// REABRIR PARTIDO
// ======================================================


async function reopenMatch() {

  const confirmed =
    confirm(
      "¿Reabrir este partido?"
    );


  if (!confirmed) {

    return;

  }


  await updateMatch({

    status:
      "pending",

    clock_running:
      false,

    clock_started_at:
      null

  });

}


// ======================================================
// CREAR PARTIDOS
// ======================================================


function setupMatchEvents() {

  const sportSelect =
    document.getElementById(
      "newMatchSport"
    );


  if (sportSelect) {

    sportSelect.addEventListener(
      "change",
      refreshCreateTeamSelectors
    );

  }


  const button =
    document.getElementById(
      "createMatchButton"
    );


  if (button) {

    button.addEventListener(
      "click",
      createMatch
    );

  }

}


function refreshCreateTeamSelectors() {

  const sportElement =
    document.getElementById(
      "newMatchSport"
    );


  if (!sportElement) {

    return;

  }


  const sport =
    sportElement.value;


  fillTeamSelect(
    "newMatchHome",
    sport
  );


  fillTeamSelect(
    "newMatchAway",
    sport
  );

}


// ======================================================
// CREAR PARTIDO
// ======================================================


async function createMatch() {

  const sport =
    document
      .getElementById(
        "newMatchSport"
      )
      .value;


  const home =
    Number(
      document
        .getElementById(
          "newMatchHome"
        )
        .value
    );


  const away =
    Number(
      document
        .getElementById(
          "newMatchAway"
        )
        .value
    );


  if (
    !home ||
    !away
  ) {

    alert(
      "Elegí ambos equipos."
    );

    return;

  }


  if (
    home === away
  ) {

    alert(
      "Los equipos deben ser distintos."
    );

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("matches")
      .insert({

        sport,

        home_team_id:
          home,

        away_team_id:
          away,

        court:
          document
            .getElementById(
              "newMatchCourt"
            )
            .value
            .trim(),

        group_name:
          document
            .getElementById(
              "newMatchGroup"
            )
            .value
            .trim(),

        round_name:
          document
            .getElementById(
              "newMatchRound"
            )
            .value
            .trim(),

        match_date:
          document
            .getElementById(
              "newMatchDate"
            )
            .value ||
          null,

        start_time:
          document
            .getElementById(
              "newMatchTime"
            )
            .value ||
          null,

        home_score:
          0,

        away_score:
          0,

        status:
          "pending",

        period:
          sport === "padel"

            ? "SET 1"

            : "1T",

        elapsed_seconds:
          0,

        clock_running:
          false,

        clock_started_at:
          null

      });


  if (error) {

    console.error(
      "Error creando partido:",
      error
    );


    alert(
      "No se pudo crear el partido."
    );


    return;

  }


  await loadEverything();


  alert(
    "Partido creado."
  );

}


// ======================================================
// LISTA DE PARTIDOS
// ======================================================


function renderMatchesList() {

  const container =
    document.getElementById(
      "matchesAdminList"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  if (
    !adminMatches.length
  ) {

    container.innerHTML = `

      <div class="admin-empty">

        No hay partidos.

      </div>

    `;

    return;

  }


  adminMatches.forEach(match => {

    const card =
      document.createElement(
        "article"
      );


    card.className =
      "admin-list-card";


    const sportIcon =
      match.sport === "padel"

        ? "🎾"

        : "⚽";


    const time =
      match.start_time
        ?.slice(0,5) ||
      "--:--";


    card.innerHTML = `

      <div class="admin-list-main">

        <span>

          ${sportIcon}

          ${time}

        </span>


        <strong>

          ${teamName(
            match.home_team_id
          )}

          vs

          ${teamName(
            match.away_team_id
          )}

        </strong>


        <small>

          ${match.court || "Sin cancha"}

          ${
            match.group_name

              ? " · " +
                match.group_name

              : ""
          }

        </small>

      </div>


      <div class="admin-list-actions">

        <button
          class="edit-match"
        >
          Editar
        </button>


        <button
          class="delete-match"
        >
          Eliminar
        </button>

      </div>

    `;


    card
      .querySelector(
        ".edit-match"
      )
      .addEventListener(
        "click",
        () => {

          selectedMatchId =
            match.id;


          const sport =
            document.getElementById(
              "controlSport"
            );


          if (sport) {

            sport.value =
              match.sport;

          }


          openAdminSection(
            "control"
          );


          renderMatchSelector();

          renderControl();

        }
      );


    card
      .querySelector(
        ".delete-match"
      )
      .addEventListener(
        "click",
        () => {

          deleteMatch(
            match
          );

        }
      );


    container.appendChild(
      card
    );

  });

}


// ======================================================
// ELIMINAR PARTIDO
// ======================================================


async function deleteMatch(match) {

  const confirmed =
    confirm(
      `¿Eliminar ${teamName(match.home_team_id)} vs ${teamName(match.away_team_id)}?`
    );


  if (!confirmed) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("matches")
      .delete()
      .eq(
        "id",
        match.id
      );


  if (error) {

    console.error(
      "Error eliminando partido:",
      error
    );


    alert(
      "No se pudo eliminar el partido."
    );


    return;

  }


  selectedMatchId =
    null;


  await loadEverything();

}


// ======================================================
// EQUIPOS
// ======================================================


function setupTeamEvents() {

  const button =
    document.getElementById(
      "createTeamButton"
    );


  if (button) {

    button.addEventListener(
      "click",
      createTeam
    );

  }

}


// ======================================================
// CREAR EQUIPO
// ======================================================


async function createTeam() {

  const name =
    document
      .getElementById(
        "newTeamName"
      )
      .value
      .trim();


  if (!name) {

    alert(
      "Ingresá el nombre del equipo."
    );

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("teams")
      .insert({

        name,

        sport:
          document
            .getElementById(
              "newTeamSport"
            )
            .value,

        group_name:
          document
            .getElementById(
              "newTeamGroup"
            )
            .value
            .trim()

      });


  if (error) {

    console.error(
      "Error creando equipo:",
      error
    );


    alert(
      "No se pudo crear el equipo."
    );


    return;

  }


  document
    .getElementById(
      "newTeamName"
    )
    .value =
      "";


  document
    .getElementById(
      "newTeamGroup"
    )
    .value =
      "";


  await loadEverything();

}


// ======================================================
// LISTA DE EQUIPOS
// ======================================================


function renderTeamsList() {

  const container =
    document.getElementById(
      "teamsAdminList"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  if (
    !adminTeams.length
  ) {

    container.innerHTML = `

      <div class="admin-empty">

        No hay equipos.

      </div>

    `;

    return;

  }


  adminTeams.forEach(team => {

    const card =
      document.createElement(
        "article"
      );


    card.className =
      "admin-list-card";


    card.innerHTML = `

      <div class="admin-list-main">

        <span>

          ${
            team.sport ===
            "padel"

              ? "🎾 Pádel"

              : "⚽ Fútbol"
          }

        </span>


        <strong>

          ${team.name}

        </strong>


        <small>

          ${team.group_name || "Sin grupo"}

        </small>

      </div>


      <div class="admin-list-actions">

        <button
          class="edit-team"
        >
          Editar
        </button>


        <button
          class="delete-team"
        >
          Eliminar
        </button>

      </div>

    `;


    card
      .querySelector(
        ".edit-team"
      )
      .addEventListener(
        "click",
        () => {

          editTeam(
            team
          );

        }
      );


    card
      .querySelector(
        ".delete-team"
      )
      .addEventListener(
        "click",
        () => {

          deleteTeam(
            team
          );

        }
      );


    container.appendChild(
      card
    );

  });

}


// ======================================================
// EDITAR EQUIPO
// ======================================================


async function editTeam(team) {

  const name =
    prompt(
      "Nombre del equipo:",
      team.name
    );


  if (
    name === null ||
    !name.trim()
  ) {

    return;

  }


  const group =
    prompt(
      "Grupo:",
      team.group_name ||
      ""
    );


  if (
    group === null
  ) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("teams")
      .update({

        name:
          name.trim(),

        group_name:
          group.trim()

      })
      .eq(
        "id",
        team.id
      );


  if (error) {

    console.error(
      "Error editando equipo:",
      error
    );


    alert(
      "No se pudo editar el equipo."
    );


    return;

  }


  await loadEverything();

}


// ======================================================
// ELIMINAR EQUIPO
// ======================================================


async function deleteTeam(team) {

  const confirmed =
    confirm(
      `¿Eliminar "${team.name}"?`
    );


  if (!confirmed) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("teams")
      .delete()
      .eq(
        "id",
        team.id
      );


  if (error) {

    console.error(
      "Error eliminando equipo:",
      error
    );


    alert(
      "No se pudo eliminar el equipo."
    );


    return;

  }


  await loadEverything();

}