// ======================================================
// COPA RAÍCES - ADMIN
// SIN INICIO DE SESIÓN
// FÚTBOL + PÁDEL (1 SET / PUNTO DE ORO)
// ======================================================

let adminTeams = [];
let adminMatches = [];
let adminEvents = [];

let selectedMatchId = null;

let clockInterval = null;
let adminRealtimeChannel = null;


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

  setupAdminRealtime();

}


// ======================================================
// REALTIME ADMIN
// ======================================================

function setupAdminRealtime() {

  if (
    typeof supabaseClient === "undefined" ||
    adminRealtimeChannel
  ) {

    return;

  }


  const reload =
    async () => {

      await loadEverything();

    };


  adminRealtimeChannel =
    supabaseClient

      .channel(
        "copa-raices-admin"
      )

      .on(

        "postgres_changes",

        {
          event: "*",
          schema: "public",
          table: "matches"
        },

        reload

      )

      .on(

        "postgres_changes",

        {
          event: "*",
          schema: "public",
          table: "match_events"
        },

        reload

      )

      .on(

        "postgres_changes",

        {
          event: "*",
          schema: "public",
          table: "teams"
        },

        reload

      )

      .subscribe();

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


function openAdminSection(
  section
) {

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

      .from(
        "teams"
      )

      .select(
        "*"
      )

      .order(
        "name",
        {
          ascending:
            true
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

      .from(
        "matches"
      )

      .select(
        "*"
      )

      .order(
        "match_date",
        {
          ascending:
            true,

          nullsFirst:
            false
        }
      )

      .order(
        "start_time",
        {
          ascending:
            true,

          nullsFirst:
            false
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

      .from(
        "match_events"
      )

      .select(
        "*"
      )

      .order(
        "created_at",
        {
          ascending:
            true
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

function getTeam(
  id
) {

  return adminTeams.find(
    team =>
      Number(team.id) ===
      Number(id)
  );

}


function teamName(
  id
) {

  return (
    getTeam(id)?.name ||
    "Equipo"
  );

}


function currentMatch() {

  return adminMatches.find(
    match =>
      Number(match.id) ===
      Number(selectedMatchId)
  );

}


function formatClock(
  seconds
) {

  const mins =
    Math.floor(
      seconds / 60
    );


  const secs =
    seconds % 60;


  return (

    String(
      mins
    ).padStart(
      2,
      "0"
    )

    +

    ":"

    +

    String(
      secs
    ).padStart(
      2,
      "0"
    )

  );

}


function getLiveSeconds(
  match
) {

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


function eventIcon(
  type
) {

  switch (type) {

    case "goal":
      return "⚽";

    case "yellow":
      return "🟨";

    case "red":
      return "🟥";

    default:
      return "•";

  }

}


// ======================================================
// HELPERS PÁDEL
// ======================================================

function padelPointText(
  value
) {

  const points = [
    "0",
    "15",
    "30",
    "40"
  ];


  const index =
    Math.max(

      0,

      Math.min(
        3,
        Number(
          value || 0
        )
      )

    );


  return points[index];

}


function padelHomeGames(
  match
) {

  return Number(

    match.padel_home_games ??

    match.home_score ??

    0

  );

}


function padelAwayGames(
  match
) {

  return Number(

    match.padel_away_games ??

    match.away_score ??

    0

  );

}


function padelHistory(
  match
) {

  return Array.isArray(
    match.padel_history
  )

    ? match.padel_history

    : [];

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
// SELECTOR PARTIDO
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


  const statusPriority = {
    pending: 0,
    live: 1,
    finished: 2
  };


  const filtered =
    adminMatches

      .filter(
        match =>
          match.sport === sport
      )

      .sort(
        (a, b) => {

          const priorityA =
            statusPriority[
              a.status
            ] ?? 3;


          const priorityB =
            statusPriority[
              b.status
            ] ?? 3;


          // 1. Pendientes
          // 2. En vivo
          // 3. Finalizados

          if (
            priorityA !==
            priorityB
          ) {

            return (
              priorityA -
              priorityB
            );

          }


          // Dentro de pendientes:
          // horario más cercano primero

          if (
            a.status === "pending"
          ) {

            return String(
              a.start_time || "99:99"
            )
            .localeCompare(
              String(
                b.start_time || "99:99"
              )
            );

          }


          // Dentro de partidos en vivo:
          // horario más reciente primero

          if (
            a.status === "live"
          ) {

            return String(
              b.start_time || ""
            )
            .localeCompare(
              String(
                a.start_time || ""
              )
            );

          }


          // Finalizados:
          // los más recientes primero,
          // pero siempre debajo de los pendientes.

          return String(
            b.start_time || ""
          )
          .localeCompare(
            String(
              a.start_time || ""
            )
          );

        }
      );


  select.innerHTML =
    "";


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


  filtered.forEach(
    match => {

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


      const round =
        String(
          match.round_name || ""
        ).trim();


      let statusText =
        "";


      if (
        match.status ===
        "live"
      ) {

        statusText =
          " 🔴 EN VIVO";

      }


      else if (
        match.status ===
        "finished"
      ) {

        statusText =
          " · Terminado";

      }


      option.textContent =

        `${time} · `

        +

        (
          round
            ? `${round} · `
            : ""
        )

        +

        `${teamName(match.home_team_id)} vs ${teamName(match.away_team_id)}`

        +

        statusText;
      if (
  match.status === "finished"
) {

  option.style.color =
    "#d32f2f";

  option.style.fontWeight =
    "700";

}

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

    }
  );

}


// ======================================================
// CONTROL
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
      "adminMatchCourt"
    )
    .textContent =

      `${match.court || "Sin cancha"}${
        match.group_name
          ? " · " + match.group_name
          : ""
      }`;


  renderStatus(
    match
  );


  renderSportScoreboard(
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


  toggleSportSpecificAdmin(
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
// MARCADOR SEGÚN DEPORTE
// ======================================================

function renderSportScoreboard(
  match
) {

  const homeScore =
    document.getElementById(
      "adminHomeScore"
    );


  const awayScore =
    document.getElementById(
      "adminAwayScore"
    );


  const homeMinus =
    document.getElementById(
      "homeMinus"
    );


  const awayMinus =
    document.getElementById(
      "awayMinus"
    );


  const homePlus =
    document.getElementById(
      "homePlus"
    );


  const awayPlus =
    document.getElementById(
      "awayPlus"
    );


  if (
    match.sport ===
    "padel"
  ) {

    homeScore.textContent =
      padelHomeGames(
        match
      );


    awayScore.textContent =
      padelAwayGames(
        match
      );


    homeMinus.style.display =
      "none";


    awayMinus.style.display =
      "none";


    homePlus.textContent =
      "+ Punto";


    awayPlus.textContent =
      "+ Punto";


    ensurePadelPanel();

    renderPadelPanel(
      match
    );

  }

  else {

    homeScore.textContent =
      Number(
        match.home_score ||
        0
      );


    awayScore.textContent =
      Number(
        match.away_score ||
        0
      );


    homeMinus.style.display =
      "inline-flex";


    awayMinus.style.display =
      "inline-flex";


    homePlus.textContent =
      "+";


    awayPlus.textContent =
      "+";


    const padelPanel =
      document.getElementById(
        "padelAdminPanel"
      );


    if (padelPanel) {

      padelPanel.style.display =
        "none";

    }

  }

}


// ======================================================
// PANEL PÁDEL
// ======================================================

function ensurePadelPanel() {

  if (
    document.getElementById(
      "padelAdminPanel"
    )
  ) {

    return;

  }


  const scoreboard =
    document.querySelector(
      ".admin-scoreboard"
    );


  if (!scoreboard) {

    return;

  }


  const panel =
    document.createElement(
      "div"
    );


  panel.id =
    "padelAdminPanel";


  panel.className =
    "admin-padel-panel";


  panel.innerHTML = `

    <div class="admin-padel-status">

      <span class="admin-team-label">
        PUNTOS
      </span>

      <div class="admin-padel-points">

        <strong id="padelHomePointText">
          0
        </strong>

        <span>
          -
        </span>

        <strong id="padelAwayPointText">
          0
        </strong>

      </div>

      <div
        id="padelSpecialState"
        class="admin-padel-special"
      >
      </div>

    </div>


    <div class="
      admin-button-row
      admin-padel-actions
    ">

      <button
        id="undoPadelPoint"
        class="admin-secondary-button"
      >
        ↶ Deshacer último punto
      </button>


      <button
        id="resetPadelScore"
        class="
          admin-secondary-button
          danger
        "
      >
        Reiniciar marcador
      </button>

    </div>

  `;


  scoreboard
    .insertAdjacentElement(
      "afterend",
      panel
    );


  document
    .getElementById(
      "undoPadelPoint"
    )
    .addEventListener(
      "click",
      undoPadelPoint
    );


  document
    .getElementById(
      "resetPadelScore"
    )
    .addEventListener(
      "click",
      resetPadelScore
    );

}


function renderPadelPanel(
  match
) {

  const panel =
    document.getElementById(
      "padelAdminPanel"
    );


  if (!panel) {

    return;

  }


  panel.style.display =
    "block";


  const homePointText =
    document.getElementById(
      "padelHomePointText"
    );


  const awayPointText =
    document.getElementById(
      "padelAwayPointText"
    );


  const special =
    document.getElementById(
      "padelSpecialState"
    );


  if (
    match.padel_tiebreak
  ) {

    homePointText.textContent =
      Number(
        match.padel_home_tiebreak ||
        0
      );


    awayPointText.textContent =
      Number(
        match.padel_away_tiebreak ||
        0
      );


    special.textContent =
      "TIE-BREAK";


    special.style.display =
      "block";


    return;

  }


  const homePoints =
    Number(
      match.padel_home_points ||
      0
    );


  const awayPoints =
    Number(
      match.padel_away_points ||
      0
    );


  homePointText.textContent =
    padelPointText(
      homePoints
    );


  awayPointText.textContent =
    padelPointText(
      awayPoints
    );


  if (
    homePoints === 3 &&
    awayPoints === 3
  ) {

    special.textContent =
      "PUNTO DE ORO";


    special.style.display =
      "block";

  }

  else {

    special.textContent =
      "";


    special.style.display =
      "none";

  }

}


// ======================================================
// OCULTAR EVENTOS EN PÁDEL
// ======================================================

function toggleSportSpecificAdmin(
  match
) {

  const eventButton =
    document.getElementById(
      "addEventButton"
    );


  const eventsBlock =
    eventButton?.closest(
      ".admin-edit-block"
    );


  if (eventsBlock) {

    eventsBlock.style.display =

      match.sport ===
      "padel"

        ? "none"

        : "block";

  }

}


// ======================================================
// ESTADO
// ======================================================

function renderStatus(
  match
) {

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

function updateClockDisplay(
  match
) {

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

  if (
    clockInterval
  ) {

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

function renderPeriodButtons(
  match
) {

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

      ? [
          "SET ÚNICO"
        ]

      : [
          "1T",
          "ENTRETIEMPO",
          "2T"
        ];


  container.innerHTML =
    "";


  periods.forEach(
    period => {

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

    }
  );

}


// ======================================================
// FORMULARIO PARTIDO
// ======================================================

function fillMatchForm(
  match
) {

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
      match.court ||
      "";


  document
    .getElementById(
      "editGroup"
    )
    .value =
      match.group_name ||
      "";


  document
    .getElementById(
      "editRound"
    )
    .value =
      match.round_name ||
      "";


  document
    .getElementById(
      "editDate"
    )
    .value =
      match.match_date ||
      "";


  document
    .getElementById(
      "editTime"
    )
    .value =

      match.start_time
        ?.slice(
          0,
          5
        ) ||

      "";

}


// ======================================================
// SELECT EQUIPOS
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


  filtered.forEach(
    team => {

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

    }
  );

}


function fillEventTeams(
  match
) {

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

    .forEach(
      id => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          id;


        option.textContent =
          teamName(
            id
          );


        select.appendChild(
          option
        );

      }
    );

}


// ======================================================
// CONTROLES
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


  document
    .getElementById(
      "startClock"
    )
    ?.addEventListener(
      "click",
      startClock
    );


  document
    .getElementById(
      "pauseClock"
    )
    ?.addEventListener(
      "click",
      pauseClock
    );


  document
    .getElementById(
      "resetClock"
    )
    ?.addEventListener(
      "click",
      resetClock
    );


  document
    .getElementById(
      "saveMatchInfo"
    )
    ?.addEventListener(
      "click",
      saveMatchInfo
    );


  document
    .getElementById(
      "addEventButton"
    )
    ?.addEventListener(
      "click",
      createEvent
    );


  document
    .getElementById(
      "finishMatchButton"
    )
    ?.addEventListener(
      "click",
      finishMatch
    );


  document
    .getElementById(
      "reopenMatchButton"
    )
    ?.addEventListener(
      "click",
      reopenMatch
    );

}


// ======================================================
// BOTONES MARCADOR
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


      if (
        match.sport ===
        "padel"
      ) {

        if (
          amount > 0
        ) {

          await addPadelPoint(
            side
          );

        }


        return;

      }


      const field =

        side ===
        "home"

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
        [field]:
          value
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

      .from(
        "matches"
      )

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
// PÁDEL
// 1 SET + PUNTO DE ORO
// TIE-BREAK EN 6-6
// ======================================================

async function addPadelPoint(
  side
) {

  const match =
    currentMatch();


  if (
    !match ||
    match.sport !==
    "padel"
  ) {

    return;

  }


  if (
    match.status ===
    "finished"
  ) {

    alert(
      "El partido ya está finalizado."
    );

    return;

  }


  const history =
    padelHistory(
      match
    );


  const snapshot = {

    padel_home_games:
      padelHomeGames(
        match
      ),

    padel_away_games:
      padelAwayGames(
        match
      ),

    padel_home_points:
      Number(
        match.padel_home_points ||
        0
      ),

    padel_away_points:
      Number(
        match.padel_away_points ||
        0
      ),

    padel_tiebreak:
      Boolean(
        match.padel_tiebreak
      ),

    padel_home_tiebreak:
      Number(
        match.padel_home_tiebreak ||
        0
      ),

    padel_away_tiebreak:
      Number(
        match.padel_away_tiebreak ||
        0
      ),

    home_score:
      Number(
        match.home_score ||
        0
      ),

    away_score:
      Number(
        match.away_score ||
        0
      ),

    status:
      match.status,

    period:
      match.period,

    elapsed_seconds:
      Number(
        match.elapsed_seconds ||
        0
      ),

    clock_running:
      Boolean(
        match.clock_running
      ),

    clock_started_at:
      match.clock_started_at

  };


  const nextHistory = [
    ...history,
    snapshot
  ];


  let homeGames =
    padelHomeGames(
      match
    );


  let awayGames =
    padelAwayGames(
      match
    );


  let homePoints =
    Number(
      match.padel_home_points ||
      0
    );


  let awayPoints =
    Number(
      match.padel_away_points ||
      0
    );


  let homeTie =
    Number(
      match.padel_home_tiebreak ||
      0
    );


  let awayTie =
    Number(
      match.padel_away_tiebreak ||
      0
    );


  let tiebreak =
    Boolean(
      match.padel_tiebreak
    );


  let finished =
    false;


  // =====================================
  // TIE BREAK
  // =====================================

  if (tiebreak) {

    if (
      side ===
      "home"
    ) {

      homeTie++;

    }

    else {

      awayTie++;

    }


    const winnerReachedSeven =

      Math.max(
        homeTie,
        awayTie
      ) >= 7

      &&

      Math.abs(
        homeTie -
        awayTie
      ) >= 2;


    if (
      winnerReachedSeven
    ) {

      if (
        homeTie >
        awayTie
      ) {

        homeGames =
          7;

        awayGames =
          6;

      }

      else {

        homeGames =
          6;

        awayGames =
          7;

      }


      finished =
        true;


      tiebreak =
        false;

    }

  }

  // =====================================
  // GAME NORMAL
  // =====================================

  else {

    const scorerPoints =

      side ===
      "home"

        ? homePoints

        : awayPoints;


    const opponentPoints =

      side ===
      "home"

        ? awayPoints

        : homePoints;


    let gameWon =
      false;


    // 40-40:
    // el siguiente punto gana directamente

    if (
      scorerPoints === 3 &&
      opponentPoints === 3
    ) {

      gameWon =
        true;

    }

    // 40-0 / 40-15 / 40-30

    else if (
      scorerPoints === 3 &&
      opponentPoints < 3
    ) {

      gameWon =
        true;

    }

    else {

      if (
        side ===
        "home"
      ) {

        homePoints++;

      }

      else {

        awayPoints++;

      }

    }


    if (gameWon) {

      if (
        side ===
        "home"
      ) {

        homeGames++;

      }

      else {

        awayGames++;

      }


      homePoints =
        0;


      awayPoints =
        0;


      // 6-6 = tie break

      if (
        homeGames === 6 &&
        awayGames === 6
      ) {

        tiebreak =
          true;


        homeTie =
          0;


        awayTie =
          0;

      }

      else {

        const gamesLeader =
          Math.max(
            homeGames,
            awayGames
          );


        const gameDifference =
          Math.abs(
            homeGames -
            awayGames
          );


        // 6-0, 6-1, 6-2, 6-3, 6-4
        // o 7-5

        if (
          gamesLeader >= 6 &&
          gameDifference >= 2
        ) {

          finished =
            true;

        }

      }

    }

  }


  const changes = {

    padel_home_games:
      homeGames,

    padel_away_games:
      awayGames,

    padel_home_points:
      homePoints,

    padel_away_points:
      awayPoints,

    padel_tiebreak:
      tiebreak,

    padel_home_tiebreak:
      homeTie,

    padel_away_tiebreak:
      awayTie,

    padel_history:
      nextHistory,

    home_score:
      homeGames,

    away_score:
      awayGames,

    period:
      "SET ÚNICO",

    status:
      finished
        ? "finished"
        : "live"

  };


  if (finished) {

    changes.elapsed_seconds =
      getLiveSeconds(
        match
      );


    changes.clock_running =
      false;


    changes.clock_started_at =
      null;

  }


  await updateMatch(
    changes
  );

}


// ======================================================
// DESHACER PUNTO PÁDEL
// ======================================================

async function undoPadelPoint() {

  const match =
    currentMatch();


  if (
    !match ||
    match.sport !==
    "padel"
  ) {

    return;

  }


  const history =
    padelHistory(
      match
    );


  if (!history.length) {

    alert(
      "No hay puntos para deshacer."
    );

    return;

  }


  const previous =
    history[
      history.length - 1
    ];


  const nextHistory =
    history.slice(
      0,
      -1
    );


  await updateMatch({

    padel_home_games:
      Number(
        previous.padel_home_games ||
        0
      ),

    padel_away_games:
      Number(
        previous.padel_away_games ||
        0
      ),

    padel_home_points:
      Number(
        previous.padel_home_points ||
        0
      ),

    padel_away_points:
      Number(
        previous.padel_away_points ||
        0
      ),

    padel_tiebreak:
      Boolean(
        previous.padel_tiebreak
      ),

    padel_home_tiebreak:
      Number(
        previous.padel_home_tiebreak ||
        0
      ),

    padel_away_tiebreak:
      Number(
        previous.padel_away_tiebreak ||
        0
      ),

    padel_history:
      nextHistory,

    home_score:
      Number(
        previous.home_score ||
        previous.padel_home_games ||
        0
      ),

    away_score:
      Number(
        previous.away_score ||
        previous.padel_away_games ||
        0
      ),

    status:
      previous.status ||
      "live",

    period:
      previous.period ||
      "SET ÚNICO",

    elapsed_seconds:
      Number(
        previous.elapsed_seconds ||
        0
      ),

    clock_running:
      Boolean(
        previous.clock_running
      ),

    clock_started_at:
      previous.clock_started_at ||
      null

  });

}


// ======================================================
// REINICIAR MARCADOR PÁDEL
// ======================================================

async function resetPadelScore() {

  const match =
    currentMatch();


  if (
    !match ||
    match.sport !==
    "padel"
  ) {

    return;

  }


  const confirmed =
    confirm(
      "¿Reiniciar completamente el marcador de pádel?"
    );


  if (!confirmed) {

    return;

  }


  await updateMatch({

    padel_home_games:
      0,

    padel_away_games:
      0,

    padel_home_points:
      0,

    padel_away_points:
      0,

    padel_tiebreak:
      false,

    padel_home_tiebreak:
      0,

    padel_away_tiebreak:
      0,

    padel_history:
      [],

    home_score:
      0,

    away_score:
      0,

    status:
      "pending",

    period:
      "SET ÚNICO",

    elapsed_seconds:
      0,

    clock_running:
      false,

    clock_started_at:
      null

  });

}


// ======================================================
// RELOJ ACCIONES
// ======================================================

async function startClock() {

  const match =
    currentMatch();


  if (
    !match ||
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
// GUARDAR PARTIDO
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
// EVENTOS FÚTBOL
// ======================================================

async function createEvent() {

  const match =
    currentMatch();


  if (
    !match ||
    match.sport !==
    "football"
  ) {

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
    ) ||
    0;


  if (!teamId) {

    alert(
      "Seleccioná un equipo."
    );

    return;

  }


  if (!player) {

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


  if (
    type ===
    "goal"
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

        .from(
          "matches"
        )

        .update({

          [field]:
            newScore,

          status:

            match.status ===
            "pending"

              ? "live"

              : match.status

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

function renderAdminEvents(
  match
) {

  const container =
    document.getElementById(
      "adminEventsList"
    );


  if (!container) {

    return;

  }


  if (
    match.sport !==
    "football"
  ) {

    container.innerHTML =
      "";

    return;

  }


  const list =
    adminEvents

      .filter(
        event =>
          Number(event.match_id) ===
          Number(match.id)
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


  list.forEach(
    event => {

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

    }
  );

}


// ======================================================
// ELIMINAR EVENTO
// ======================================================

async function deleteEvent(
  event
) {

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

      .from(
        "matches"
      )

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
// FINALIZAR / REABRIR
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


async function reopenMatch() {

  const confirmed =
    confirm(
      "¿Reabrir este partido?"
    );


  if (!confirmed) {

    return;

  }


  const match =
    currentMatch();


  await updateMatch({

    status:

      match?.sport ===
      "padel"

        ? "live"

        : "pending",

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


  document
    .getElementById(
      "createMatchButton"
    )
    ?.addEventListener(
      "click",
      createMatch
    );

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


  const payload = {

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

      sport ===
      "padel"

        ? "SET ÚNICO"

        : "1T",

    elapsed_seconds:
      0,

    clock_running:
      false,

    clock_started_at:
      null

  };


  if (
    sport ===
    "padel"
  ) {

    Object.assign(
      payload,
      {

        padel_home_games:
          0,

        padel_away_games:
          0,

        padel_home_points:
          0,

        padel_away_points:
          0,

        padel_tiebreak:
          false,

        padel_home_tiebreak:
          0,

        padel_away_tiebreak:
          0,

        padel_history:
          []

      }
    );

  }


  const {
    error
  } =
    await supabaseClient

      .from(
        "matches"
      )

      .insert(
        payload
      );


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
// LISTA PARTIDOS
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


  adminMatches.forEach(
    match => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-list-card";


      const sportIcon =

        match.sport ===
        "padel"

          ? "🎾"

          : "⚽";


      const time =

        match.start_time
          ?.slice(
            0,
            5
          ) ||

        "--:--";


      const scoreText =

        match.status ===
        "pending"

          ? "Pendiente"

          : match.sport ===
            "padel"

            ? `${padelHomeGames(match)} - ${padelAwayGames(match)}`

            : `${match.home_score || 0} - ${match.away_score || 0}`;


      card.innerHTML = `

        <div class="admin-list-main">

          <span>

            ${sportIcon}

            ${time}

            ·

            ${scoreText}

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

    }
  );

}


// ======================================================
// ELIMINAR PARTIDO
// ======================================================

async function deleteMatch(
  match
) {

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

      .from(
        "matches"
      )

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

  document
    .getElementById(
      "createTeamButton"
    )
    ?.addEventListener(
      "click",
      createTeam
    );

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

      .from(
        "teams"
      )

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
// LISTA EQUIPOS
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


  adminTeams.forEach(
    team => {

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

    }
  );

}


// ======================================================
// EDITAR EQUIPO
// ======================================================

async function editTeam(
  team
) {

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

      .from(
        "teams"
      )

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

async function deleteTeam(
  team
) {

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

      .from(
        "teams"
      )

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

// ======================================================
// DATOS DEL PARTIDO PLEGABLE
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupCollapsibleMatchData();

  }
);


function setupCollapsibleMatchData() {

  const saveButton =
    document.getElementById(
      "saveMatchInfo"
    );


  if (!saveButton) {
    return;
  }


  const block =
    saveButton.closest(
      ".admin-edit-block"
    );


  if (!block) {
    return;
  }


  // Evitar crear el desplegable dos veces

  if (
    block.classList.contains(
      "match-data-collapsible"
    )
  ) {
    return;
  }


  block.classList.add(
    "match-data-collapsible"
  );


  const heading =
    block.querySelector(
      ".admin-block-heading"
    );


  if (!heading) {
    return;
  }


  const title =
    heading.querySelector(
      "h2"
    );


  if (!title) {
    return;
  }


  // Crear botón superior

  const toggleButton =
    document.createElement(
      "button"
    );


  toggleButton.type =
    "button";


  toggleButton.className =
    "match-data-toggle";


  toggleButton.setAttribute(
    "aria-expanded",
    "true"
  );


  toggleButton.innerHTML = `

    <span>
      Datos del partido
    </span>

    <span
      class="match-data-arrow"
      aria-hidden="true"
    >
      ▼
    </span>

  `;


  // Reemplazamos solamente el título visual

  heading.innerHTML =
    "";


  heading.appendChild(
    toggleButton
  );


  // Crear contenedor de lo que se abre/cierra

  const content =
    document.createElement(
      "div"
    );


  content.className =
    "match-data-content";


  while (
    heading.nextSibling
  ) {

    content.appendChild(
      heading.nextSibling
    );

  }


  block.appendChild(
    content
  );


  // Abrir / cerrar

  toggleButton.addEventListener(
    "click",
    () => {

      const isClosed =
        block.classList.toggle(
          "match-data-closed"
        );


      toggleButton.setAttribute(
        "aria-expanded",
        String(
          !isClosed
        )
      );


      const arrow =
        toggleButton.querySelector(
          ".match-data-arrow"
        );


      if (arrow) {

        arrow.textContent =
          isClosed
            ? "▶"
            : "▼";

      }

    }
  );


  // CSS del desplegable
  // Lo ponemos desde JS para que no tengas
  // que modificar styles.css.

  if (
    !document.getElementById(
      "matchDataCollapseStyles"
    )
  ) {

    const style =
      document.createElement(
        "style"
      );


    style.id =
      "matchDataCollapseStyles";


    style.textContent = `

      .match-data-collapsible {
        padding-top: 0 !important;
        margin-top: 24px;
        border-top: 1px solid var(--border);
      }


      .match-data-collapsible
      .admin-block-heading {
        margin-bottom: 0;
      }


      .match-data-toggle {
        width: 100%;
        min-height: 58px;

        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 15px;

        padding: 0;

        border: 0;

        background: transparent;

        color: var(--navy);

        font-size: 18px;
        font-weight: 900;

        text-align: left;

        cursor: pointer;
      }


      .match-data-arrow {
        width: 34px;
        height: 34px;

        display: grid;
        place-items: center;

        flex-shrink: 0;

        border-radius: 50%;

        background: #edf3f8;

        color: var(--navy);

        font-size: 12px;

        transition:
          background .2s ease,
          transform .2s ease;
      }


      .match-data-toggle:hover
      .match-data-arrow {
        background: var(--blue-soft);
      }


      .match-data-content {
        overflow: hidden;

        max-height: 1000px;

        opacity: 1;

        transition:
          max-height .3s ease,
          opacity .2s ease,
          padding .3s ease;
      }


      .match-data-closed
      .match-data-content {
        max-height: 0;

        opacity: 0;

        pointer-events: none;
      }


      @media (max-width: 540px) {

        .match-data-toggle {
          min-height: 55px;

          font-size: 17px;
        }


        .match-data-arrow {
          width: 32px;
          height: 32px;
        }

      }

    `;


    document.head.appendChild(
      style
    );

  }

}

// ======================================================
// PLAYOFFS AUTOMÁTICOS DE FÚTBOL
// FORMATO COPA RAÍCES
// 1° A vs 2° B
// 1° B vs 2° A
// FINAL: ganador SF1 vs ganador SF2
// ======================================================


document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupFootballPlayoffsAdmin();

  }
);


// ======================================================
// CREAR PANEL EN ADMIN
// ======================================================

function setupFootballPlayoffsAdmin() {

  if (
    document.getElementById(
      "footballPlayoffsAdminCard"
    )
  ) {
    return;
  }


  const section =
    document.getElementById(
      "admin-matches"
    );


  if (!section) {
    return;
  }


  const createMatchCard =
    section.querySelector(
      ".admin-card"
    );


  if (!createMatchCard) {
    return;
  }


  const card =
    document.createElement(
      "div"
    );


  card.id =
    "footballPlayoffsAdminCard";


  card.className =
    "admin-card";


  card.style.marginTop =
    "22px";


  card.innerHTML = `

    <div class="admin-block-heading">

      <h2>
        Playoffs de fútbol
      </h2>

    </div>


    <p
      style="
        margin-bottom:16px;
        color:var(--text-soft);
        font-size:13px;
        line-height:1.5;
      "
    >
      Genera automáticamente las semifinales
      con los 2 primeros de cada grupo y,
      cuando ambas semifinales terminen,
      genera la final.
    </p>


    <button
      id="generateFootballPlayoffs"
      class="
        admin-primary-button
        admin-full-button
      "
    >
      Generar / actualizar playoffs
    </button>


    <div
      id="footballPlayoffAdminStatus"
      style="
        margin-top:14px;
        font-size:12px;
        color:var(--text-soft);
      "
    >
    </div>

  `;


  createMatchCard
    .insertAdjacentElement(
      "afterend",
      card
    );


  document
    .getElementById(
      "generateFootballPlayoffs"
    )
    .addEventListener(
      "click",
      generateFootballPlayoffs
    );


  renderFootballPlayoffAdminStatus();

}


// ======================================================
// HELPERS
// ======================================================

function normalizeAdminGroup(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /^grupo\s+/i,
      ""
    )
    .toUpperCase();

}


function isAdminFootballPlayoff(
  match
) {

  if (
    match.sport !==
    "football"
  ) {
    return false;
  }


  const round =
    String(
      match.round_name || ""
    )
    .toLowerCase();


  return (
    round.includes(
      "semi"
    )
    ||
    (
      round.includes(
        "final"
      )
      &&
      !round.includes(
        "fase"
      )
    )
  );

}


function adminFootballGroupMatches() {

  return adminMatches.filter(
    match =>
      match.sport === "football"
      &&
      !isAdminFootballPlayoff(
        match
      )
  );

}


function getAdminMatchGroup(
  match
) {

  if (
    match.group_name
  ) {

    return normalizeAdminGroup(
      match.group_name
    );

  }


  const home =
    getTeam(
      match.home_team_id
    );


  const away =
    getTeam(
      match.away_team_id
    );


  return normalizeAdminGroup(
    home?.group_name ||
    away?.group_name ||
    ""
  );

}


// ======================================================
// TABLA DE UN GRUPO
// ======================================================

function calculateAdminFootballGroupStandings(
  groupName
) {

  const table =
    {};


  const groupTeams =
    adminTeams.filter(
      team =>
        team.sport ===
          "football"
        &&
        normalizeAdminGroup(
          team.group_name
        ) ===
          normalizeAdminGroup(
            groupName
          )
    );


  groupTeams.forEach(
    team => {

      table[
        team.id
      ] = {

        id:
          team.id,

        name:
          team.name,

        pj:
          0,

        pg:
          0,

        pe:
          0,

        pp:
          0,

        gf:
          0,

        gc:
          0,

        dg:
          0,

        pts:
          0

      };

    }
  );


  adminFootballGroupMatches()

    .filter(
      match =>
        getAdminMatchGroup(
          match
        ) ===
          normalizeAdminGroup(
            groupName
          )
    )

    .filter(
      match =>
        match.status ===
        "finished"
    )

    .forEach(
      match => {

        const home =
          table[
            match.home_team_id
          ];


        const away =
          table[
            match.away_team_id
          ];


        if (
          !home ||
          !away
        ) {
          return;
        }


        const h =
          Number(
            match.home_score ||
            0
          );


        const a =
          Number(
            match.away_score ||
            0
          );


        home.pj++;

        away.pj++;


        home.gf +=
          h;

        home.gc +=
          a;


        away.gf +=
          a;

        away.gc +=
          h;


        if (
          h > a
        ) {

          home.pg++;

          home.pts +=
            3;

          away.pp++;

        }

        else if (
          a > h
        ) {

          away.pg++;

          away.pts +=
            3;

          home.pp++;

        }

        else {

          home.pe++;

          away.pe++;

          home.pts++;

          away.pts++;

        }

      }
    );


  return Object

    .values(
      table
    )

    .map(
      team => {

        team.dg =
          team.gf -
          team.gc;


        return team;

      }
    )

    .sort(
      (
        a,
        b
      ) =>

        b.pts -
        a.pts

        ||

        b.dg -
        a.dg

        ||

        b.gf -
        a.gf

        ||

        a.name.localeCompare(
          b.name,
          "es"
        )
    );

}


// ======================================================
// GRUPO TERMINADO
// ======================================================

function isAdminFootballGroupFinished(
  groupName
) {

  const teams =
    adminTeams.filter(
      team =>
        team.sport ===
          "football"
        &&
        normalizeAdminGroup(
          team.group_name
        ) ===
          normalizeAdminGroup(
            groupName
          )
    );


  if (
    teams.length < 2
  ) {

    return false;

  }


  const expectedMatches =
    (
      teams.length *
      (
        teams.length - 1
      )
    ) / 2;


  const groupMatches =
    adminFootballGroupMatches()
      .filter(
        match =>
          getAdminMatchGroup(
            match
          ) ===
            normalizeAdminGroup(
              groupName
            )
      );


  const finished =
    groupMatches.filter(
      match =>
        match.status ===
        "finished"
    ).length;


  return (
    groupMatches.length >=
      expectedMatches
    &&
    finished >=
      expectedMatches
  );

}


// ======================================================
// BUSCAR RONDA
// ======================================================

function findAdminFootballRound(
  name
) {

  return adminMatches.find(
    match =>
      match.sport ===
        "football"
      &&
      String(
        match.round_name || ""
      )
      .trim()
      .toLowerCase() ===
        name.toLowerCase()
  ) || null;

}


// ======================================================
// CREAR / ACTUALIZAR PARTIDO PLAYOFF
// ======================================================

async function createOrUpdateFootballPlayoff(
  {
    round,
    homeId,
    awayId,
    court,
    time,
    date = null
  }
) {

  const existing =
    findAdminFootballRound(
      round
    );


  const payload = {

    sport:
      "football",

    home_team_id:
      homeId,

    away_team_id:
      awayId,

    court:
      String(
        court
      ),

    group_name:
      "",

    round_name:
      round,

    match_date:
      date,

    start_time:
      time,

    period:
      "1T"

  };


  // Si ya está jugándose o terminó,
  // no cambiamos los participantes.

  if (
    existing &&
    (
      existing.status ===
        "live"
      ||
      existing.status ===
        "finished"
    )
  ) {

    return existing;

  }


  if (existing) {

    const {
      error
    } =
      await supabaseClient

        .from(
          "matches"
        )

        .update({
          ...payload,

          home_score:
            0,

          away_score:
            0,

          status:
            "pending",

          elapsed_seconds:
            0,

          clock_running:
            false,

          clock_started_at:
            null
        })

        .eq(
          "id",
          existing.id
        );


    if (error) {

      throw error;

    }


    return existing;

  }


  const {
    data,
    error
  } =
    await supabaseClient

      .from(
        "matches"
      )

      .insert({

        ...payload,

        home_score:
          0,

        away_score:
          0,

        status:
          "pending",

        elapsed_seconds:
          0,

        clock_running:
          false,

        clock_started_at:
          null

      })

      .select()
      .single();


  if (error) {

    throw error;

  }


  return data;

}


// ======================================================
// GANADOR
// ======================================================

function getAdminFootballWinnerId(
  match
) {

  if (
    !match ||
    match.status !==
      "finished"
  ) {

    return null;

  }


  const home =
    Number(
      match.home_score ||
      0
    );


  const away =
    Number(
      match.away_score ||
      0
    );


  if (
    home > away
  ) {

    return Number(
      match.home_team_id
    );

  }


  if (
    away > home
  ) {

    return Number(
      match.away_team_id
    );

  }


  return null;

}


// ======================================================
// FECHA BASE
// ======================================================

function getFootballPlayoffDate() {

  const datedMatches =
    adminFootballGroupMatches()

      .filter(
        match =>
          match.match_date
      )

      .sort(
        (
          a,
          b
        ) =>
          String(
            b.match_date
          )
          .localeCompare(
            String(
              a.match_date
            )
          )
      );


  return (
    datedMatches[0]
      ?.match_date ||
    null
  );

}


// ======================================================
// GENERAR PLAYOFFS
// ======================================================

async function generateFootballPlayoffs() {

  const status =
    document.getElementById(
      "footballPlayoffAdminStatus"
    );


  const button =
    document.getElementById(
      "generateFootballPlayoffs"
    );


  if (button) {

    button.disabled =
      true;


    button.textContent =
      "Procesando...";

  }


  try {

    const groups =
      [
        ...new Set(

          adminTeams

            .filter(
              team =>
                team.sport ===
                  "football"
              &&
                team.group_name
            )

            .map(
              team =>
                normalizeAdminGroup(
                  team.group_name
                )
            )

        )
      ]
      .sort(
        (
          a,
          b
        ) =>
          a.localeCompare(
            b,
            "es"
          )
      );


    if (
      groups.length < 2
    ) {

      alert(
        "Necesitás al menos 2 grupos de fútbol."
      );

      return;

    }


    const groupA =
      groups[0];


    const groupB =
      groups[1];


    if (
      !isAdminFootballGroupFinished(
        groupA
      )
      ||
      !isAdminFootballGroupFinished(
        groupB
      )
    ) {

      alert(
        "La fase de grupos todavía no terminó. Para generar las semifinales tienen que estar cargados y finalizados todos los partidos de ambos grupos."
      );

      return;

    }


    const tableA =
      calculateAdminFootballGroupStandings(
        groupA
      );


    const tableB =
      calculateAdminFootballGroupStandings(
        groupB
      );


    if (
      tableA.length < 2 ||
      tableB.length < 2
    ) {

      alert(
        "No se pudieron determinar los 2 clasificados de cada grupo."
      );

      return;

    }


    const firstA =
      tableA[0];


    const secondA =
      tableA[1];


    const firstB =
      tableB[0];


    const secondB =
      tableB[1];


    const date =
      getFootballPlayoffDate();


    // =====================================
    // SEMIFINAL 1
    // 1° A vs 2° B
    // Cancha 1
    // 15:15
    // =====================================

    await createOrUpdateFootballPlayoff({

      round:
        "Semifinal 1",

      homeId:
        firstA.id,

      awayId:
        secondB.id,

      court:
        "1",

      time:
        "15:15:00",

      date

    });


    // =====================================
    // SEMIFINAL 2
    // 1° B vs 2° A
    // Cancha 2
    // 15:15
    // =====================================

    await createOrUpdateFootballPlayoff({

      round:
        "Semifinal 2",

      homeId:
        firstB.id,

      awayId:
        secondA.id,

      court:
        "2",

      time:
        "15:15:00",

      date

    });


    await loadEverything();


    // =====================================
    // FINAL
    // Se crea solamente cuando
    // terminaron ambas semifinales.
    // =====================================

    const sf1 =
      findAdminFootballRound(
        "Semifinal 1"
      );


    const sf2 =
      findAdminFootballRound(
        "Semifinal 2"
      );


    const winner1 =
      getAdminFootballWinnerId(
        sf1
      );


    const winner2 =
      getAdminFootballWinnerId(
        sf2
      );


    if (
      winner1 &&
      winner2
    ) {

      await createOrUpdateFootballPlayoff({

        round:
          "Final",

        homeId:
          winner1,

        awayId:
          winner2,

        court:
          "1",

        time:
          "16:00:00",

        date

      });


      await loadEverything();


      if (status) {

        status.textContent =
          "Semifinales y final actualizadas.";

      }


      alert(
        "Playoffs actualizados. La final ya quedó generada con los ganadores de las semifinales."
      );

    }

    else {

      if (
        sf1?.status ===
          "finished"
        &&
        sf2?.status ===
          "finished"
        &&
        (
          !winner1 ||
          !winner2
        )
      ) {

        alert(
          "Hay una semifinal empatada. Necesitamos definir el ganador antes de generar la final."
        );

      }

      else {

        if (status) {

          status.textContent =
            "Semifinales generadas. Cuando terminen, volvé a presionar este botón para generar la final.";

        }


        alert(
          "Semifinales generadas correctamente."
        );

      }

    }

  }

  catch (error) {

    console.error(
      "Error generando playoffs:",
      error
    );


    alert(
      "No se pudieron generar los playoffs."
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        "Generar / actualizar playoffs";

    }


    renderFootballPlayoffAdminStatus();

  }

}


// ======================================================
// ESTADO DEL PANEL
// ======================================================

function renderFootballPlayoffAdminStatus() {

  const status =
    document.getElementById(
      "footballPlayoffAdminStatus"
    );


  if (!status) {
    return;
  }


  const sf1 =
    findAdminFootballRound(
      "Semifinal 1"
    );


  const sf2 =
    findAdminFootballRound(
      "Semifinal 2"
    );


  const finalMatch =
    findAdminFootballRound(
      "Final"
    );


  if (
    finalMatch
  ) {

    status.textContent =
      "✓ Final creada.";

    return;

  }


  if (
    sf1 &&
    sf2
  ) {

    status.textContent =
      "✓ Semifinales creadas. Cuando ambas terminen, presioná nuevamente el botón para generar la final.";

    return;

  }


  status.textContent =
    "Las semifinales se podrán generar cuando finalice la fase de grupos.";

}

// ======================================================
// DEFINICIÓN POR PENALES - FÚTBOL
// SOLO PLAYOFFS
// ======================================================


// Conservamos el render original y agregamos
// el panel de penales después.

const renderControlBeforePenalties =
  renderControl;


renderControl =
  function () {

    renderControlBeforePenalties();

    renderFootballPenaltyPanel(
      currentMatch()
    );

  };


// ======================================================
// CREAR PANEL
// ======================================================

function ensureFootballPenaltyPanel() {

  if (
    document.getElementById(
      "footballPenaltyPanel"
    )
  ) {
    return;
  }


  const scoreboard =
    document.querySelector(
      ".admin-scoreboard"
    );


  if (!scoreboard) {
    return;
  }


  const panel =
    document.createElement(
      "div"
    );


  panel.id =
    "footballPenaltyPanel";


  panel.className =
    "football-penalty-panel";


  panel.innerHTML = `

    <div class="football-penalty-title">

      <div>

        <span>
          DESEMPATE
        </span>

        <strong>
          Definición por penales
        </strong>

      </div>

      <small>
        Solo se utiliza si el partido termina empatado.
      </small>

    </div>


    <div class="football-penalty-score">


      <div class="football-penalty-team">

        <span id="penaltyHomeName">
          Local
        </span>

        <div class="football-penalty-controls">

          <button
            id="penaltyHomeMinus"
            type="button"
          >
            −
          </button>

          <strong id="penaltyHomeScore">
            0
          </strong>

          <button
            id="penaltyHomePlus"
            type="button"
          >
            +
          </button>

        </div>

      </div>


      <span class="football-penalty-vs">
        -
      </span>


      <div class="football-penalty-team">

        <span id="penaltyAwayName">
          Visitante
        </span>

        <div class="football-penalty-controls">

          <button
            id="penaltyAwayMinus"
            type="button"
          >
            −
          </button>

          <strong id="penaltyAwayScore">
            0
          </strong>

          <button
            id="penaltyAwayPlus"
            type="button"
          >
            +
          </button>

        </div>

      </div>

    </div>


    <button
      id="resetFootballPenalties"
      type="button"
      class="football-penalty-reset"
    >
      Reiniciar penales
    </button>

  `;


  scoreboard.insertAdjacentElement(
    "afterend",
    panel
  );


  document
    .getElementById(
      "penaltyHomePlus"
    )
    .addEventListener(
      "click",
      () =>
        changeFootballPenalty(
          "home",
          1
        )
    );


  document
    .getElementById(
      "penaltyHomeMinus"
    )
    .addEventListener(
      "click",
      () =>
        changeFootballPenalty(
          "home",
          -1
        )
    );


  document
    .getElementById(
      "penaltyAwayPlus"
    )
    .addEventListener(
      "click",
      () =>
        changeFootballPenalty(
          "away",
          1
        )
    );


  document
    .getElementById(
      "penaltyAwayMinus"
    )
    .addEventListener(
      "click",
      () =>
        changeFootballPenalty(
          "away",
          -1
        )
    );


  document
    .getElementById(
      "resetFootballPenalties"
    )
    .addEventListener(
      "click",
      resetFootballPenalties
    );


  // CSS del panel

  if (
    !document.getElementById(
      "footballPenaltyStyles"
    )
  ) {

    const style =
      document.createElement(
        "style"
      );


    style.id =
      "footballPenaltyStyles";


    style.textContent = `

      .football-penalty-panel {
        display: none;

        margin-top: 18px;
        padding: 18px;

        border: 1px solid #d8e4ed;
        border-radius: 14px;

        background: #f8fbfd;
      }


      .football-penalty-title {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 15px;

        margin-bottom: 18px;
      }


      .football-penalty-title div {
        display: grid;
        gap: 2px;
      }


      .football-penalty-title span {
        color: var(--text-soft);

        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1px;
      }


      .football-penalty-title strong {
        color: var(--navy);

        font-size: 17px;
        font-weight: 900;
      }


      .football-penalty-title small {
        max-width: 260px;

        color: var(--text-soft);

        font-size: 11px;
        line-height: 1.4;

        text-align: right;
      }


      .football-penalty-score {
        display: grid;

        grid-template-columns:
          minmax(0, 1fr)
          30px
          minmax(0, 1fr);

        align-items: center;

        gap: 12px;
      }


      .football-penalty-team {
        display: grid;
        gap: 10px;

        text-align: center;
      }


      .football-penalty-team > span {
        color: var(--navy);

        font-size: 13px;
        font-weight: 850;
      }


      .football-penalty-controls {
        display: flex;
        align-items: center;
        justify-content: center;

        gap: 12px;
      }


      .football-penalty-controls button {
        width: 38px;
        height: 38px;

        display: grid;
        place-items: center;

        border: 0;
        border-radius: 50%;

        background: var(--navy);

        color: #ffffff;

        font-size: 20px;
        font-weight: 900;

        cursor: pointer;
      }


      .football-penalty-controls strong {
        min-width: 30px;

        color: var(--navy);

        font-size: 27px;
        font-weight: 950;

        text-align: center;
      }


      .football-penalty-vs {
        color: var(--text-soft);

        font-size: 20px;
        font-weight: 900;

        text-align: center;
      }


      .football-penalty-reset {
        width: 100%;

        margin-top: 18px;
        padding: 11px;

        border: 0;
        border-radius: 10px;

        background: #edf2f6;

        color: var(--navy);

        font-size: 11px;
        font-weight: 850;

        cursor: pointer;
      }


      @media (max-width: 540px) {

        .football-penalty-title {
          display: grid;
        }


        .football-penalty-title small {
          max-width: none;

          text-align: left;
        }


        .football-penalty-controls {
          gap: 8px;
        }

      }

    `;


    document.head.appendChild(
      style
    );

  }

}


// ======================================================
// MOSTRAR / OCULTAR PANEL
// ======================================================

function renderFootballPenaltyPanel(
  match
) {

  ensureFootballPenaltyPanel();


  const panel =
    document.getElementById(
      "footballPenaltyPanel"
    );


  if (
    !panel ||
    !match
  ) {
    return;
  }


  const playoff =
    match.sport === "football"
    &&
    isAdminFootballPlayoff(
      match
    );


  const tied =
    Number(
      match.home_score || 0
    )
    ===
    Number(
      match.away_score || 0
    );


  // Solo aparece en playoffs
  // cuando el partido ya comenzó
  // y está empatado.

  if (
    !playoff ||
    match.status === "pending" ||
    !tied
  ) {

    panel.style.display =
      "none";

    return;

  }


  panel.style.display =
    "block";


  document
    .getElementById(
      "penaltyHomeName"
    )
    .textContent =
      teamName(
        match.home_team_id
      );


  document
    .getElementById(
      "penaltyAwayName"
    )
    .textContent =
      teamName(
        match.away_team_id
      );


  document
    .getElementById(
      "penaltyHomeScore"
    )
    .textContent =
      Number(
        match.football_home_penalties ||
        0
      );


  document
    .getElementById(
      "penaltyAwayScore"
    )
    .textContent =
      Number(
        match.football_away_penalties ||
        0
      );

}


// ======================================================
// SUMAR / RESTAR PENAL
// ======================================================

async function changeFootballPenalty(
  side,
  amount
) {

  const match =
    currentMatch();


  if (
    !match ||
    match.sport !== "football" ||
    !isAdminFootballPlayoff(match)
  ) {
    return;
  }


  if (
    Number(match.home_score || 0) !==
    Number(match.away_score || 0)
  ) {

    alert(
      "Los penales solo corresponden si el partido terminó empatado."
    );

    return;

  }


  const field =
    side === "home"

      ? "football_home_penalties"

      : "football_away_penalties";


  const value =
    Math.max(
      0,
      Number(
        match[field] || 0
      )
      +
      amount
    );


  await updateMatch({
    [field]:
      value
  });

}


// ======================================================
// REINICIAR PENALES
// ======================================================

async function resetFootballPenalties() {

  const match =
    currentMatch();


  if (!match) {
    return;
  }


  const confirmed =
    confirm(
      "¿Reiniciar la definición por penales?"
    );


  if (!confirmed) {
    return;
  }


  await updateMatch({

    football_home_penalties:
      0,

    football_away_penalties:
      0

  });

}


// ======================================================
// GANADOR DE PLAYOFF
// INCLUYE PENALES
// ======================================================

function getAdminFootballWinnerId(
  match
) {

  if (
    !match ||
    match.status !== "finished"
  ) {

    return null;

  }


  const home =
    Number(
      match.home_score || 0
    );


  const away =
    Number(
      match.away_score || 0
    );


  // Ganador en tiempo reglamentario

  if (
    home > away
  ) {

    return Number(
      match.home_team_id
    );

  }


  if (
    away > home
  ) {

    return Number(
      match.away_team_id
    );

  }


  // Empate → definición por penales

  const homePenalties =
    Number(
      match.football_home_penalties ||
      0
    );


  const awayPenalties =
    Number(
      match.football_away_penalties ||
      0
    );


  if (
    homePenalties >
    awayPenalties
  ) {

    return Number(
      match.home_team_id
    );

  }


  if (
    awayPenalties >
    homePenalties
  ) {

    return Number(
      match.away_team_id
    );

  }


  // Todavía no hay ganador

  return null;

}

// ======================================================
// PLAYOFFS AUTOMÁTICOS DE PÁDEL
//
// CUARTOS
// 1A - 2D
// 1B - 2C
// 1C - 2B
// 2A - 1D
//
// SEMIS
// QF1 - QF2
// QF3 - QF4
//
// FINAL
// SF1 - SF2
// ======================================================


if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    setupPadelPlayoffsAdmin
  );

}

else {

  setupPadelPlayoffsAdmin();

}


// ======================================================
// PANEL ADMIN
// ======================================================

function setupPadelPlayoffsAdmin() {

  if (
    document.getElementById(
      "padelPlayoffsAdminCard"
    )
  ) {
    return;
  }


  const section =
    document.getElementById(
      "admin-matches"
    );


  if (!section) {
    return;
  }


  const firstCard =
    section.querySelector(
      ".admin-card"
    );


  if (!firstCard) {
    return;
  }


  const card =
    document.createElement(
      "div"
    );


  card.id =
    "padelPlayoffsAdminCard";


  card.className =
    "admin-card";


  card.style.marginTop =
    "22px";


  card.innerHTML = `

    <div class="admin-block-heading">

      <h2>
        Playoffs de pádel
      </h2>

    </div>


    <p
      style="
        margin-bottom:16px;
        color:var(--text-soft);
        font-size:13px;
        line-height:1.5;
      "
    >

      Genera automáticamente cuartos,
      semifinales y final según las
      posiciones de los grupos A, B, C y D.

    </p>


    <button
      id="generatePadelPlayoffs"
      class="
        admin-primary-button
        admin-full-button
      "
    >

      Generar / actualizar playoffs de pádel

    </button>


    <div
      id="padelPlayoffAdminStatus"
      style="
        margin-top:14px;
        font-size:12px;
        color:var(--text-soft);
      "
    >
    </div>

  `;


  const footballCard =
    document.getElementById(
      "footballPlayoffsAdminCard"
    );


  const anchor =
    footballCard ||
    firstCard;


  anchor.insertAdjacentElement(
    "afterend",
    card
  );


  document
    .getElementById(
      "generatePadelPlayoffs"
    )
    .addEventListener(
      "click",
      generatePadelPlayoffs
    );


  renderPadelPlayoffAdminStatus();

}


// ======================================================
// HELPERS
// ======================================================

function normalizePadelGroup(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /^grupo\s+/i,
      ""
    )
    .toUpperCase();

}


function isAdminPadelPlayoff(
  match
) {

  if (
    match.sport !== "padel"
  ) {
    return false;
  }


  const round =
    String(
      match.round_name || ""
    )
    .toLowerCase();


  return (
    round.includes("cuarto") ||
    round.includes("semi") ||
    round.includes("final")
  );

}


function adminPadelGroupMatches() {

  return adminMatches.filter(
    match =>
      match.sport === "padel"
      &&
      !isAdminPadelPlayoff(
        match
      )
  );

}


function getAdminPadelMatchGroup(
  match
) {

  if (
    match.group_name
  ) {

    return normalizePadelGroup(
      match.group_name
    );

  }


  const home =
    getTeam(
      match.home_team_id
    );


  const away =
    getTeam(
      match.away_team_id
    );


  return normalizePadelGroup(
    home?.group_name ||
    away?.group_name ||
    ""
  );

}


// ======================================================
// POSICIONES DE UN GRUPO
// ======================================================

function calculateAdminPadelGroupStandings(
  groupName
) {

  const table = {};


  adminTeams

    .filter(
      team =>
        team.sport === "padel"
        &&
        normalizePadelGroup(
          team.group_name
        ) ===
        normalizePadelGroup(
          groupName
        )
    )

    .forEach(
      team => {

        table[team.id] = {

          id: team.id,

          name: team.name,

          pj: 0,

          pg: 0,

          pp: 0,

          gf: 0,

          gc: 0,

          dg: 0,

          pts: 0

        };

      }
    );


  adminPadelGroupMatches()

    .filter(
      match =>
        getAdminPadelMatchGroup(
          match
        ) ===
        normalizePadelGroup(
          groupName
        )
    )

    .filter(
      match =>
        match.status === "finished"
    )

    .forEach(
      match => {

        const home =
          table[
            match.home_team_id
          ];


        const away =
          table[
            match.away_team_id
          ];


        if (
          !home ||
          !away
        ) {
          return;
        }


        const h =
          Number(
            match.padel_home_games ||
            match.home_score ||
            0
          );


        const a =
          Number(
            match.padel_away_games ||
            match.away_score ||
            0
          );


        home.pj++;
        away.pj++;


        home.gf += h;
        home.gc += a;


        away.gf += a;
        away.gc += h;


        if (h > a) {

          home.pg++;
          home.pts += 1;

          away.pp++;

        }

        else if (a > h) {

          away.pg++;
          away.pts += 1;

          home.pp++;

        }

      }
    );


  return Object

    .values(table)

    .map(
      team => {

        team.dg =
          team.gf -
          team.gc;

        return team;

      }
    )

    .sort(
      (a, b) =>

        b.pts -
        a.pts

        ||

        b.dg -
        a.dg

        ||

        b.gf -
        a.gf

        ||

        a.name.localeCompare(
          b.name,
          "es"
        )

    );

}


// ======================================================
// SABER SI TERMINÓ UN GRUPO
// ======================================================

function isAdminPadelGroupFinished(
  groupName
) {

  const teams =
    adminTeams.filter(
      team =>
        team.sport === "padel"
        &&
        normalizePadelGroup(
          team.group_name
        ) ===
        normalizePadelGroup(
          groupName
        )
    );


  if (
    teams.length < 2
  ) {
    return false;
  }


  const expectedMatches =
    (
      teams.length *
      (
        teams.length - 1
      )
    ) / 2;


  const groupMatches =
    adminPadelGroupMatches()
      .filter(
        match =>
          getAdminPadelMatchGroup(
            match
          ) ===
          normalizePadelGroup(
            groupName
          )
      );


  const finished =
    groupMatches.filter(
      match =>
        match.status ===
        "finished"
    ).length;


  return (
    groupMatches.length >=
      expectedMatches
    &&
    finished >=
      expectedMatches
  );

}


// ======================================================
// BUSCAR RONDA
// ======================================================

function findAdminPadelRound(
  name
) {

  return adminMatches.find(
    match =>
      match.sport === "padel"
      &&
      String(
        match.round_name || ""
      )
      .trim()
      .toLowerCase() ===
      name.toLowerCase()
  ) || null;

}


// ======================================================
// GANADOR DE PARTIDO
// ======================================================

function getAdminPadelWinnerId(
  match
) {

  if (
    !match ||
    match.status !== "finished"
  ) {

    return null;

  }


  const home =
    Number(
      match.padel_home_games ||
      match.home_score ||
      0
    );


  const away =
    Number(
      match.padel_away_games ||
      match.away_score ||
      0
    );


  if (
    home > away
  ) {

    return Number(
      match.home_team_id
    );

  }


  if (
    away > home
  ) {

    return Number(
      match.away_team_id
    );

  }


  return null;

}


// ======================================================
// FECHA
// ======================================================

function getPadelPlayoffDate() {

  const dated =
    adminPadelGroupMatches()

      .filter(
        match =>
          match.match_date
      )

      .sort(
        (a, b) =>
          String(
            b.match_date
          )
          .localeCompare(
            String(
              a.match_date
            )
          )
      );


  return (
    dated[0]?.match_date ||
    null
  );

}


// ======================================================
// CREAR / ACTUALIZAR PARTIDO
// ======================================================

async function createOrUpdatePadelPlayoff({
  round,
  homeId,
  awayId,
  court,
  time,
  date
}) {

  const existing =
    findAdminPadelRound(
      round
    );


  const payload = {

    sport:
      "padel",

    home_team_id:
      homeId,

    away_team_id:
      awayId,

    court:
      String(court),

    group_name:
      "",

    round_name:
      round,

    match_date:
      date,

    start_time:
      time,

    period:
      "SET ÚNICO"

  };


  if (
    existing
    &&
    (
      existing.status === "live"
      ||
      existing.status === "finished"
    )
  ) {

    return existing;

  }


  const resetData = {

    ...payload,

    status:
      "pending",

    home_score:
      0,

    away_score:
      0,

    padel_home_games:
      0,

    padel_away_games:
      0,

    padel_home_points:
      0,

    padel_away_points:
      0,

    padel_tiebreak:
      false,

    padel_home_tiebreak:
      0,

    padel_away_tiebreak:
      0,

    padel_history:
      [],

    elapsed_seconds:
      0,

    clock_running:
      false,

    clock_started_at:
      null

  };


  if (existing) {

    const {
      error
    } =
      await supabaseClient

        .from("matches")

        .update(
          resetData
        )

        .eq(
          "id",
          existing.id
        );


    if (error) {
      throw error;
    }


    return existing;

  }


  const {
    data,
    error
  } =
    await supabaseClient

      .from("matches")

      .insert(
        resetData
      )

      .select()
      .single();


  if (error) {
    throw error;
  }


  return data;

}


// ======================================================
// GENERAR PLAYOFFS
// ======================================================

async function generatePadelPlayoffs() {

  const button =
    document.getElementById(
      "generatePadelPlayoffs"
    );


  const status =
    document.getElementById(
      "padelPlayoffAdminStatus"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Procesando...";

  }


  try {

    const requiredGroups =
      ["A", "B", "C", "D"];


    const availableGroups =
      new Set(

        adminTeams

          .filter(
            team =>
              team.sport === "padel"
          )

          .map(
            team =>
              normalizePadelGroup(
                team.group_name
              )
          )

      );


    const missingGroup =
      requiredGroups.find(
        group =>
          !availableGroups.has(
            group
          )
      );


    if (missingGroup) {

      alert(
        `Falta el Grupo ${missingGroup} de pádel.`
      );

      return;

    }


    const unfinished =
      requiredGroups.find(
        group =>
          !isAdminPadelGroupFinished(
            group
          )
      );


    if (unfinished) {

      alert(
        `El Grupo ${unfinished} todavía no terminó.`
      );

      return;

    }


    const A =
      calculateAdminPadelGroupStandings(
        "A"
      );


    const B =
      calculateAdminPadelGroupStandings(
        "B"
      );


    const C =
      calculateAdminPadelGroupStandings(
        "C"
      );


    const D =
      calculateAdminPadelGroupStandings(
        "D"
      );


    if (
      A.length < 2 ||
      B.length < 2 ||
      C.length < 2 ||
      D.length < 2
    ) {

      alert(
        "No se pudieron determinar los clasificados."
      );

      return;

    }


    const date =
      getPadelPlayoffDate();


    // ==================================
    // CUARTOS · 15:10
    // ==================================

    await createOrUpdatePadelPlayoff({

      round:
        "Cuartos 1",

      homeId:
        A[0].id,

      awayId:
        D[1].id,

      court:
        "1",

      time:
        "15:10:00",

      date

    });


    await createOrUpdatePadelPlayoff({

      round:
        "Cuartos 2",

      homeId:
        B[0].id,

      awayId:
        C[1].id,

      court:
        "2",

      time:
        "15:10:00",

      date

    });


    await createOrUpdatePadelPlayoff({

      round:
        "Cuartos 3",

      homeId:
        C[0].id,

      awayId:
        B[1].id,

      court:
        "3",

      time:
        "15:10:00",

      date

    });


    await createOrUpdatePadelPlayoff({

      round:
        "Cuartos 4",

      homeId:
        A[1].id,

      awayId:
        D[0].id,

      court:
        "4",

      time:
        "15:10:00",

      date

    });


    await loadEverything();


    const qf1 =
      findAdminPadelRound(
        "Cuartos 1"
      );


    const qf2 =
      findAdminPadelRound(
        "Cuartos 2"
      );


    const qf3 =
      findAdminPadelRound(
        "Cuartos 3"
      );


    const qf4 =
      findAdminPadelRound(
        "Cuartos 4"
      );


    const qfWinners = [

      getAdminPadelWinnerId(
        qf1
      ),

      getAdminPadelWinnerId(
        qf2
      ),

      getAdminPadelWinnerId(
        qf3
      ),

      getAdminPadelWinnerId(
        qf4
      )

    ];


    // ==================================
    // SEMIFINALES · 15:45
    // ==================================

    if (
      qfWinners.every(Boolean)
    ) {

      await createOrUpdatePadelPlayoff({

        round:
          "Semifinal 1",

        homeId:
          qfWinners[0],

        awayId:
          qfWinners[1],

        court:
          "1",

        time:
          "15:45:00",

        date

      });


      await createOrUpdatePadelPlayoff({

        round:
          "Semifinal 2",

        homeId:
          qfWinners[2],

        awayId:
          qfWinners[3],

        court:
          "2",

        time:
          "15:45:00",

        date

      });


      await loadEverything();

    }


    const sf1 =
      findAdminPadelRound(
        "Semifinal 1"
      );


    const sf2 =
      findAdminPadelRound(
        "Semifinal 2"
      );


    const sfWinner1 =
      getAdminPadelWinnerId(
        sf1
      );


    const sfWinner2 =
      getAdminPadelWinnerId(
        sf2
      );


    // ==================================
    // FINAL · 16:15
    // ==================================

    if (
      sfWinner1 &&
      sfWinner2
    ) {

      await createOrUpdatePadelPlayoff({

        round:
          "Final",

        homeId:
          sfWinner1,

        awayId:
          sfWinner2,

        court:
          "1",

        time:
          "16:15:00",

        date

      });


      await loadEverything();

    }


    if (
      sfWinner1 &&
      sfWinner2
    ) {

      alert(
        "Final de pádel generada."
      );

    }

    else if (
      qfWinners.every(Boolean)
    ) {

      alert(
        "Semifinales de pádel generadas."
      );

    }

    else {

      alert(
        "Cuartos de final de pádel generados."
      );

    }


    renderPadelPlayoffAdminStatus();

  }

  catch (error) {

    console.error(
      "Error generando playoffs de pádel:",
      error
    );


    alert(
      "No se pudieron generar los playoffs de pádel."
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        "Generar / actualizar playoffs de pádel";

    }

  }

}


// ======================================================
// ESTADO
// ======================================================

function renderPadelPlayoffAdminStatus() {

  const status =
    document.getElementById(
      "padelPlayoffAdminStatus"
    );


  if (!status) {
    return;
  }


  if (
    findAdminPadelRound(
      "Final"
    )
  ) {

    status.textContent =
      "✓ Final creada.";

    return;

  }


  if (
    findAdminPadelRound(
      "Semifinal 1"
    )
    &&
    findAdminPadelRound(
      "Semifinal 2"
    )
  ) {

    status.textContent =
      "✓ Semifinales creadas.";

    return;

  }


  if (
    findAdminPadelRound(
      "Cuartos 1"
    )
  ) {

    status.textContent =
      "✓ Cuartos de final creados.";

    return;

  }


  status.textContent =
    "Los cuartos se generan cuando terminen los 4 grupos.";

}