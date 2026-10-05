// ======================================================
// COPA RAÍCES - ADMIN
// ======================================================

let adminTeams = [];
let adminMatches = [];
let adminEvents = [];

let selectedMatchId = null;

let clockInterval = null;


// ======================================================
// ELEMENTOS
// ======================================================

const loginScreen =
  document.getElementById("loginScreen");

const adminApp =
  document.getElementById("adminApp");


// ======================================================
// INIT
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  initAdmin
);


async function initAdmin() {

  setupLogin();

  setupNavigation();

  setupControlEvents();

  setupMatchEvents();

  setupTeamEvents();

  const {
    data: { session }
  } =
    await supabaseClient.auth.getSession();


  if (session) {

    showAdmin();

    await loadEverything();

  }

  else {

    showLogin();

  }


  supabaseClient.auth.onAuthStateChange(
    async (_event, session) => {

      if (session) {

        showAdmin();

        await loadEverything();

      }

      else {

        showLogin();

      }

    }
  );

}


// ======================================================
// LOGIN
// ======================================================

function setupLogin() {

  document
    .getElementById("loginForm")
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          document
            .getElementById("loginEmail")
            .value
            .trim();


        const password =
          document
            .getElementById("loginPassword")
            .value;


        const message =
          document
            .getElementById("loginMessage");


        message.textContent =
          "Ingresando...";


        const {
          error
        } =
          await supabaseClient
            .auth
            .signInWithPassword({
              email,
              password
            });


        if (error) {

          message.textContent =
            "Email o contraseña incorrectos.";

          return;

        }


        message.textContent = "";

      }
    );


  document
    .getElementById("logoutButton")
    .addEventListener(
      "click",
      async () => {

        await supabaseClient
          .auth
          .signOut();

      }
    );

}


function showLogin() {

  loginScreen.classList.remove(
    "hidden"
  );

  adminApp.classList.add(
    "hidden"
  );

}


function showAdmin() {

  loginScreen.classList.add(
    "hidden"
  );

  adminApp.classList.remove(
    "hidden"
  );

}



// ======================================================
// NAV
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


  document
    .getElementById(
      `admin-${section}`
    )
    .classList
    .add("active");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}



// ======================================================
// LOAD
// ======================================================

async function loadEverything() {

  await loadTeams();

  await loadMatches();

  await loadEvents();

  renderAll();

}


async function loadTeams() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("teams")
      .select("*")
      .order("name");


  if (error) {

    console.error(error);

    return;

  }


  adminTeams =
    data || [];

}


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

    console.error(error);

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
        match.id ===
        selectedMatchId
    )
  ) {

    selectedMatchId =
      adminMatches[0]?.id ||
      null;

  }

}


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

    console.error(error);

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
    Math.floor(seconds / 60);

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
      match.elapsed_seconds || 0
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
// RENDER ALL
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

  const sport =
    document
      .getElementById("controlSport")
      .value;


  const select =
    document
      .getElementById("matchSelector");


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

    option.value = "";

    select.appendChild(option);

    selectedMatchId = null;

    return;

  }


  if (
    !filtered.some(
      match =>
        Number(match.id) ===
        Number(selectedMatchId)
    )
  ) {

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


    option.textContent =
      `${match.start_time?.slice(0,5) || "--:--"} · ${teamName(match.home_team_id)} vs ${teamName(match.away_team_id)}`;


    if (
      Number(match.id) ===
      Number(selectedMatchId)
    ) {

      option.selected = true;

    }


    select.appendChild(option);

  });

}



// ======================================================
// CONTROL
// ======================================================

function renderControl() {

  const match =
    currentMatch();


  stopClockInterval();


  if (!match) {

    document
      .getElementById(
        "controlPanel"
      )
      .style
      .display =
        "none";

    return;

  }


  document
    .getElementById(
      "controlPanel"
    )
    .style
    .display =
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
      `${match.court || "Sin cancha"} ${match.group_name ? "· " + match.group_name : ""}`;


  renderStatus(match);

  renderPeriodButtons(match);

  fillMatchForm(match);

  fillEventTeams(match);

  renderAdminEvents(match);

  updateClockDisplay(match);


  if (match.clock_running) {

    startClockInterval();

  }

}



// ======================================================
// STATUS
// ======================================================

function renderStatus(match) {

  const badge =
    document.getElementById(
      "adminMatchStatus"
    );


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
// CLOCK
// ======================================================

function updateClockDisplay(match) {

  const seconds =
    getLiveSeconds(match);


  document
    .getElementById(
      "adminClock"
    )
    .textContent =
      formatClock(seconds);


  document
    .getElementById(
      "eventMinute"
    )
    .value =
      Math.floor(
        seconds / 60
      );

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

    clockInterval = null;

  }

}



// ======================================================
// PERIOD
// ======================================================

function renderPeriodButtons(
  match
) {

  const container =
    document
      .getElementById(
        "periodButtons"
      );


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


  container.innerHTML = "";


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
// FORM PARTIDO
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
        ?.slice(0,5) ||
      "";

}



// ======================================================
// TEAM SELECT
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


  select.innerHTML = "";


  adminTeams
    .filter(
      team =>
        team.sport ===
        sport
    )
    .forEach(team => {

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
// EVENT TEAM
// ======================================================

function fillEventTeams(match) {

  const select =
    document
      .getElementById(
        "eventTeam"
      );


  select.innerHTML = "";


  [
    match.home_team_id,
    match.away_team_id
  ]
  .forEach(id => {

    const option =
      document.createElement(
        "option"
      );


    option.value = id;

    option.textContent =
      teamName(id);


    select.appendChild(
      option
    );

  });

}



// ======================================================
// CONTROL EVENTS
// ======================================================

function setupControlEvents() {

  document
    .getElementById(
      "controlSport"
    )
    .addEventListener(
      "change",
      () => {

        selectedMatchId = null;

        renderMatchSelector();

        renderControl();

      }
    );


  document
    .getElementById(
      "matchSelector"
    )
    .addEventListener(
      "change",
      event => {

        selectedMatchId =
          Number(
            event.target.value
          );

        renderControl();

      }
    );


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
    .addEventListener(
      "click",
      startClock
    );


  document
    .getElementById(
      "pauseClock"
    )
    .addEventListener(
      "click",
      pauseClock
    );


  document
    .getElementById(
      "resetClock"
    )
    .addEventListener(
      "click",
      resetClock
    );


  document
    .getElementById(
      "saveMatchInfo"
    )
    .addEventListener(
      "click",
      saveMatchInfo
    );


  document
    .getElementById(
      "addEventButton"
    )
    .addEventListener(
      "click",
      createEvent
    );


  document
    .getElementById(
      "finishMatchButton"
    )
    .addEventListener(
      "click",
      finishMatch
    );


  document
    .getElementById(
      "reopenMatchButton"
    )
    .addEventListener(
      "click",
      reopenMatch
    );

}



// ======================================================
// SCORE
// ======================================================

function scoreButton(
  id,
  side,
  amount
) {

  document
    .getElementById(id)
    .addEventListener(
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
              match[field] || 0
            ) +
            amount
          );


        await updateMatch({
          [field]: value
        });

      }
    );

}



// ======================================================
// UPDATE MATCH
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
      .update(changes)
      .eq(
        "id",
        match.id
      );


  if (error) {

    console.error(error);

    alert(
      "No se pudo actualizar el partido."
    );

    return;

  }


  await loadMatches();

  renderAll();

}



// ======================================================
// START CLOCK
// ======================================================

async function startClock() {

  const match =
    currentMatch();


  if (!match) {
    return;
  }


  if (match.clock_running) {
    return;
  }


  await updateMatch({

    status: "live",

    clock_running: true,

    clock_started_at:
      new Date()
        .toISOString()

  });

}



// ======================================================
// PAUSE CLOCK
// ======================================================

async function pauseClock() {

  const match =
    currentMatch();


  if (!match) {
    return;
  }


  const seconds =
    getLiveSeconds(match);


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
// RESET CLOCK
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

    elapsed_seconds: 0,

    clock_running: false,

    clock_started_at: null

  });

}



// ======================================================
// SAVE MATCH INFO
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


  if (home === away) {

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
// EVENTS
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


  const {
    error
  } =
    await supabaseClient
      .from("match_events")
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

    console.error(error);

    alert(
      "No se pudo crear el evento."
    );

    return;

  }


  if (type === "goal") {

    const field =
      Number(teamId) ===
      Number(match.home_team_id)

        ? "home_score"

        : "away_score";


    await supabaseClient
      .from("matches")
      .update({
        [field]:
          Number(
            match[field] || 0
          ) + 1
      })
      .eq(
        "id",
        match.id
      );

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
// RENDER EVENTS
// ======================================================

function renderAdminEvents(match) {

  const container =
    document
      .getElementById(
        "adminEventsList"
      );


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
        (a,b) =>
          b.minute -
          a.minute
      );


  if (!list.length) {

    container.innerHTML = `
      <div class="admin-empty">
        No hay eventos cargados.
      </div>
    `;

    return;

  }


  container.innerHTML = "";


  list.forEach(event => {

    const item =
      document.createElement(
        "div"
      );


    item.className =
      "admin-event-row";


    item.innerHTML = `

      <div class="admin-event-icon">
        ${eventIcon(event.event_type)}
      </div>

      <div class="admin-event-info">

        <strong>
          ${event.player_name || "Evento"}
        </strong>

        <span>
          ${teamName(event.team_id)}
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
        () =>
          deleteEvent(
            event
          )
      );


    container.appendChild(
      item
    );

  });

}



// ======================================================
// DELETE EVENT
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
      .from("match_events")
      .delete()
      .eq(
        "id",
        event.id
      );


  if (error) {

    console.error(error);

    return;

  }


  if (
    event.event_type ===
    "goal" &&
    match
  ) {

    const field =
      Number(event.team_id) ===
      Number(match.home_team_id)

        ? "home_score"

        : "away_score";


    await supabaseClient
      .from("matches")
      .update({
        [field]:
          Math.max(
            0,
            Number(
              match[field] || 0
            ) - 1
          )
      })
      .eq(
        "id",
        match.id
      );

  }


  await loadEverything();

}



// ======================================================
// FINISH
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
    getLiveSeconds(match);


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
// MATCH MANAGEMENT
// ======================================================

function setupMatchEvents() {

  document
    .getElementById(
      "newMatchSport"
    )
    .addEventListener(
      "change",
      refreshCreateTeamSelectors
    );


  document
    .getElementById(
      "createMatchButton"
    )
    .addEventListener(
      "click",
      createMatch
    );

}


function refreshCreateTeamSelectors() {

  const sport =
    document
      .getElementById(
        "newMatchSport"
      )
      .value;


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


  if (home === away) {

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
          false

      });


  if (error) {

    console.error(error);

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
// MATCH LIST
// ======================================================

function renderMatchesList() {

  const container =
    document
      .getElementById(
        "matchesAdminList"
      );


  container.innerHTML = "";


  if (!adminMatches.length) {

    container.innerHTML =
      `<div class="admin-empty">
        No hay partidos.
      </div>`;

    return;

  }


  adminMatches.forEach(match => {

    const card =
      document.createElement(
        "article"
      );


    card.className =
      "admin-list-card";


    card.innerHTML = `

      <div class="admin-list-main">

        <span>
          ${match.sport === "padel" ? "🎾" : "⚽"}
          ${match.start_time?.slice(0,5) || "--:--"}
        </span>

        <strong>
          ${teamName(match.home_team_id)}
          vs
          ${teamName(match.away_team_id)}
        </strong>

        <small>
          ${match.court || "Sin cancha"}
          ${match.group_name ? " · " + match.group_name : ""}
        </small>

      </div>

      <div class="admin-list-actions">

        <button class="edit-match">
          Editar
        </button>

        <button class="delete-match">
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


          document
            .getElementById(
              "controlSport"
            )
            .value =
              match.sport;


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
        () =>
          deleteMatch(
            match
          )
      );


    container.appendChild(
      card
    );

  });

}


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

    console.error(error);

    alert(
      "No se pudo eliminar."
    );

    return;

  }


  selectedMatchId = null;

  await loadEverything();

}



// ======================================================
// TEAM MANAGEMENT
// ======================================================

function setupTeamEvents() {

  document
    .getElementById(
      "createTeamButton"
    )
    .addEventListener(
      "click",
      createTeam
    );

}


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
      "Ingresá el nombre."
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

    console.error(error);

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


  await loadEverything();

}



// ======================================================
// TEAM LIST
// ======================================================

function renderTeamsList() {

  const container =
    document
      .getElementById(
        "teamsAdminList"
      );


  container.innerHTML = "";


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
          ${team.sport === "padel" ? "🎾 Pádel" : "⚽ Fútbol"}
        </span>

        <strong>
          ${team.name}
        </strong>

        <small>
          ${team.group_name || "Sin grupo"}
        </small>

      </div>


      <div class="admin-list-actions">

        <button class="edit-team">
          Editar
        </button>

        <button class="delete-team">
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
        () =>
          editTeam(team)
      );


    card
      .querySelector(
        ".delete-team"
      )
      .addEventListener(
        "click",
        () =>
          deleteTeam(team)
      );


    container.appendChild(
      card
    );

  });

}



// ======================================================
// EDIT TEAM
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
      team.group_name || ""
    );


  if (group === null) {
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

    console.error(error);

    return;

  }


  await loadEverything();

}



// ======================================================
// DELETE TEAM
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

    console.error(error);

    alert(
      "No se pudo eliminar. Puede estar utilizado en un partido."
    );

    return;

  }


  await loadEverything();

}