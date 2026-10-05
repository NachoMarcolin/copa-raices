// ======================================================
// COPA RAÍCES
// PUBLIC APP
// ======================================================


let currentSport = "football";

let matches = [];

let events = [];

let teams = [];



// ======================================================
// DATOS DEMO
// Se utilizan si Supabase todavía no tiene partidos.
// ======================================================


const demoTeams = [

  {
    id: 1,
    name: "Sol de Mayo",
    sport: "football"
  },

  {
    id: 2,
    name: "Barrio Norte",
    sport: "football"
  },

  {
    id: 3,
    name: "Pampa FC",
    sport: "football"
  },

  {
    id: 4,
    name: "Los Andes",
    sport: "football"
  },

  {
    id: 5,
    name: "Central Argentino",
    sport: "football"
  },

  {
    id: 6,
    name: "Unión del Sur",
    sport: "football"
  },

  {
    id: 7,
    name: "Raíces FC",
    sport: "football"
  }

];


const demoMatches = [

  {

    id: 1,

    sport: "football",

    court: "Cancha 1",

    group_name: "Grupo A",

    status: "live",

    period: "1T",

    elapsed_seconds: 1020,

    home_score: 2,

    away_score: 1,

    home_team: demoTeams[0],

    away_team: demoTeams[1],

    start_time: "14:00"

  },


  {

    id: 2,

    sport: "football",

    court: "Cancha 2",

    group_name: "Grupo B",

    status: "live",

    period: "2T",

    elapsed_seconds: 1680,

    home_score: 1,

    away_score: 0,

    home_team: demoTeams[2],

    away_team: demoTeams[3],

    start_time: "14:00"

  },


  {

    id: 3,

    sport: "football",

    court: "Cancha 3",

    group_name: "Grupo A",

    status: "pending",

    home_score: 0,

    away_score: 0,

    home_team: demoTeams[4],

    away_team: demoTeams[5],

    start_time: "15:00"

  },


  {

    id: 4,

    sport: "football",

    court: "Cancha 1",

    group_name: "Grupo B",

    status: "pending",

    home_score: 0,

    away_score: 0,

    home_team: demoTeams[2],

    away_team: demoTeams[6],

    start_time: "16:30"

  },


  {

    id: 5,

    sport: "football",

    court: "Cancha 2",

    group_name: "Grupo A",

    status: "pending",

    home_score: 0,

    away_score: 0,

    home_team: demoTeams[3],

    away_team: demoTeams[1],

    start_time: "18:00"

  },


  {

    id: 6,

    sport: "football",

    court: "Cancha 3",

    group_name: "Grupo B",

    status: "pending",

    home_score: 0,

    away_score: 0,

    home_team: demoTeams[0],

    away_team: demoTeams[4],

    start_time: "19:30"

  }

];


const demoEvents = [

  {
    id: 1,
    match_id: 1,
    event_type: "goal",
    player_name: "Tomás Roldán",
    minute: 8
  },

  {
    id: 2,
    match_id: 1,
    event_type: "goal",
    player_name: "Mateo Díaz",
    minute: 12
  },

  {
    id: 3,
    match_id: 1,
    event_type: "goal",
    player_name: "Lucas Fernández",
    minute: 14
  },

  {
    id: 4,
    match_id: 2,
    event_type: "goal",
    player_name: "Nicolás Gómez",
    minute: 23
  }

];



// ======================================================
// INIT
// ======================================================


document.addEventListener(
  "DOMContentLoaded",
  initApp
);


async function initApp() {

  setupNavigation();

  setupSportSelector();

  setupLinks();

  await loadData();

  renderEverything();

}



// ======================================================
// SUPABASE
// ======================================================


async function loadData() {

  try {

    if (
      typeof supabaseClient === "undefined"
    ) {

      useDemoData();

      return;

    }


    const {
      data: matchData,
      error: matchError
    } =
      await supabaseClient
        .from("matches")
        .select(`

          *,

          home_team:teams!matches_home_team_id_fkey(
            id,
            name,
            logo_url
          ),

          away_team:teams!matches_away_team_id_fkey(
            id,
            name,
            logo_url
          )

        `)
        .order(
          "start_time",
          {
            ascending: true
          }
        );


    if (matchError) {

      console.error(
        "Error cargando partidos:",
        matchError
      );

      useDemoData();

      return;

    }


    const {
      data: eventData,
      error: eventError
    } =
      await supabaseClient
        .from("match_events")
        .select("*");


    if (eventError) {

      console.error(
        "Error cargando eventos:",
        eventError
      );

    }


    if (
      !matchData ||
      matchData.length === 0
    ) {

      useDemoData();

      return;

    }


    matches =
      matchData;

    events =
      eventData || [];


    setupRealtime();

  }

  catch (error) {

    console.error(
      "Error:",
      error
    );

    useDemoData();

  }

}



function useDemoData() {

  teams =
    demoTeams;

  matches =
    demoMatches;

  events =
    demoEvents;

}



// ======================================================
// REALTIME
// ======================================================


function setupRealtime() {

  if (
    typeof supabaseClient ===
    "undefined"
  ) {

    return;

  }


  supabaseClient
    .channel(
      "public-results"
    )

    .on(

      "postgres_changes",

      {

        event: "*",

        schema: "public",

        table: "matches"

      },

      async () => {

        await loadData();

        renderEverything();

      }

    )


    .on(

      "postgres_changes",

      {

        event: "*",

        schema: "public",

        table: "match_events"

      },

      async () => {

        await loadData();

        renderEverything();

      }

    )


    .subscribe();

}



// ======================================================
// NAVIGATION
// ======================================================


function setupNavigation() {

  const buttons =
    document.querySelectorAll(
      "[data-section]"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        openSection(
          button.dataset.section
        );

      }
    );

  });

}



function setupLinks() {

  document
    .querySelectorAll(
      "[data-go]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openSection(
            button.dataset.go
          );

        }
      );

    });

}



function openSection(sectionId) {

  document
    .querySelectorAll(
      ".page-section"
    )
    .forEach(section => {

      section.classList.remove(
        "active"
      );

    });


  const section =
    document.getElementById(
      sectionId
    );


  if (section) {

    section.classList.add(
      "active"
    );

  }


  document
    .querySelectorAll(
      "[data-section]"
    )
    .forEach(button => {

      button.classList.toggle(

        "active",

        button.dataset.section ===
        sectionId

      );

    });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}



// ======================================================
// SPORT
// ======================================================


function setupSportSelector() {

  document
    .querySelectorAll(
      ".sport-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          currentSport =
            button.dataset.sport;


          document
            .querySelectorAll(
              ".sport-button"
            )
            .forEach(btn => {

              btn.classList.remove(
                "active"
              );

            });


          button.classList.add(
            "active"
          );


          renderEverything();

        }
      );

    });

}



// ======================================================
// RENDER EVERYTHING
// ======================================================


function renderEverything() {

  renderLive();

  renderUpcoming();

  renderSchedule();

  renderFixture();

  renderStandings();

  renderScorers();

}



// ======================================================
// FILTER
// ======================================================


function sportMatches() {

  return matches.filter(
    match =>
      match.sport === currentSport
  );

}



// ======================================================
// TEAM HELPERS
// ======================================================


function initials(name = "") {

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0,2)
    .map(word =>
      word[0]
    )
    .join("")
    .toUpperCase();

}



function teamName(team) {

  return team?.name ||
    "Equipo";

}



// ======================================================
// TIME
// ======================================================


function getMinute(match) {

  return Math.floor(
    (
      match.elapsed_seconds ||
      0
    ) / 60
  );

}



function normalizeTime(time) {

  if (!time) {

    return "--:--";

  }


  return time
    .slice(0,5);

}



// ======================================================
// LIVE
// ======================================================


function renderLive() {

  const container =
    document.getElementById(
      "liveMatches"
    );


  const live =
    sportMatches()
      .filter(
        match =>
          match.status === "live"
      );


  document.getElementById(
    "liveMatchCount"
  ).textContent =
    live.length;


  document.getElementById(
    "liveCounterText"
  ).textContent =
    live.length
      ? `En vivo (${live.length})`
      : "Sin partidos en vivo";


  if (!live.length) {

    container.innerHTML = `

      <div class="empty-state">

        <strong>
          No hay partidos en vivo
        </strong>

        Los próximos partidos aparecerán
        automáticamente cuando comiencen.

      </div>

    `;

    return;

  }


  container.innerHTML =
    live
      .map(
        match =>
          liveCardHTML(match)
      )
      .join("");

}



function liveCardHTML(match) {

  const matchEvents =
    events
      .filter(
        event =>
          event.match_id ===
          match.id
      )

      .filter(
        event =>
          event.event_type ===
          "goal"
      )

      .slice(-3);


  const eventsHTML =
    matchEvents.length

      ?

      matchEvents
        .map(event => `

          <div class="match-event">

            <div class="event-info">

              <span>⚽</span>

              <span class="event-minute">
                ${event.minute}'
              </span>

              <span>
                ${event.player_name || "Gol"}
              </span>

            </div>

          </div>

        `)

        .join("")

      :

      `

        <div class="match-event">

          <span>
            Sin goles registrados
          </span>

        </div>

      `;


  return `

    <article class="live-match-card">


      <div class="match-card-top">

        <span class="live-label">
          EN VIVO
        </span>


        <span class="match-location">

          ${match.court || "Cancha"}

          ·

          ${match.group_name || ""}

        </span>


        <span class="match-clock">

          ${match.period || ""}

          ·

          ${getMinute(match)}'

        </span>

      </div>



      <div class="match-score-layout">


        <div class="match-team">

          <div class="team-crest">

            ${initials(
              teamName(match.home_team)
            )}

          </div>


          <span class="team-name">

            ${teamName(
              match.home_team
            )}

          </span>

        </div>



        <div class="score-number">

          ${match.home_score ?? 0}

          -

          ${match.away_score ?? 0}

        </div>



        <div class="match-team">

          <div class="team-crest">

            ${initials(
              teamName(match.away_team)
            )}

          </div>


          <span class="team-name">

            ${teamName(
              match.away_team
            )}

          </span>

        </div>


      </div>



      <div class="match-events">

        ${eventsHTML}

      </div>


    </article>

  `;

}



// ======================================================
// UPCOMING
// ======================================================


function renderUpcoming() {

  const container =
    document.getElementById(
      "upcomingMatches"
    );


  const upcoming =
    sportMatches()

      .filter(
        match =>
          match.status ===
          "pending"
      )

      .slice(0,4);


  if (!upcoming.length) {

    container.innerHTML = `

      <div class="empty-state">

        <strong>
          No hay próximos partidos
        </strong>

      </div>

    `;

    return;

  }


  container.innerHTML =
    upcoming.map(match => `

      <article class="upcoming-card">


        <div class="upcoming-card-top">

          <span class="upcoming-time">

            Hoy ·
            ${normalizeTime(
              match.start_time
            )}

          </span>


          <span>

            ${match.court || ""}

            ·

            ${match.group_name || ""}

          </span>

        </div>



        <div class="upcoming-versus">


          <div class="small-team">

            <div class="small-crest">

              ${initials(
                teamName(
                  match.home_team
                )
              )}

            </div>


            <span class="small-team-name">

              ${teamName(
                match.home_team
              )}

            </span>

          </div>



          <span class="vs">
            vs
          </span>



          <div class="small-team">

            <div class="small-crest">

              ${initials(
                teamName(
                  match.away_team
                )
              )}

            </div>


            <span class="small-team-name">

              ${teamName(
                match.away_team
              )}

            </span>

          </div>


        </div>


      </article>

    `).join("");

}



// ======================================================
// SIDE SCHEDULE
// ======================================================


function renderSchedule() {

  const container =
    document.getElementById(
      "daySchedule"
    );


  const list =
    sportMatches()
      .slice(0,7);


  const today =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    )
    .format(
      new Date()
    );


  document.getElementById(
    "scheduleDate"
  ).textContent =
    today.charAt(0).toUpperCase() +
    today.slice(1);


  container.innerHTML =
    list.map(match => {

      const live =
        match.status === "live";


      return `

        <div class="schedule-row">


          <span
            class="
              schedule-status-dot
              ${live ? "live" : ""}
            "
          >
          </span>


          <span class="schedule-time">

            ${
              live
                ? match.court || ""
                : normalizeTime(
                    match.start_time
                  )
            }

          </span>


          <span class="schedule-game">

            ${match.court || ""}

          </span>


          ${
            live

              ?

              `

                <div>

                  <span class="schedule-score">

                    ${match.home_score}
                    -
                    ${match.away_score}

                  </span>

                  <span class="schedule-live">
                    EN VIVO
                  </span>

                </div>

              `

              :

              `

                <span class="schedule-score">

                  ${initials(
                    teamName(
                      match.home_team
                    )
                  )}

                  vs

                  ${initials(
                    teamName(
                      match.away_team
                    )
                  )}

                </span>

              `
          }


        </div>

      `;

    }).join("");

}



// ======================================================
// FIXTURE
// ======================================================


function renderFixture() {

  const container =
    document.getElementById(
      "fixtureContent"
    );


  const list =
    sportMatches();


  if (!list.length) {

    container.innerHTML = `

      <div class="empty-state">

        <strong>
          Fixture todavía no disponible
        </strong>

      </div>

    `;

    return;

  }


  container.innerHTML =
    list.map(match => `

      <div class="fixture-row">


        <div class="fixture-date">

          ${normalizeTime(
            match.start_time
          )}

          <br>

          ${match.court || ""}

        </div>


        <div class="fixture-teams">


          <div class="fixture-team-side">

            <span class="fixture-team-name">
              ${teamName(match.home_team)}
            </span>

            ${
              match.status !== "pending"
                ? `
                  <strong class="fixture-team-score">
                    ${match.home_score}
                  </strong>
                `
                : ""
            }

          </div>


          <span class="fixture-vs">
            vs
          </span>


          <div class="fixture-team-side">

            <span class="fixture-team-name">
              ${teamName(match.away_team)}
            </span>

            ${
              match.status !== "pending"
                ? `
                  <strong class="fixture-team-score">
                    ${match.away_score}
                  </strong>
                `
                : ""
            }

          </div>


        </div>


        <div class="fixture-result">

          ${
            match.status === "pending"
              ? "Próximo"
              : match.status === "live"
                ? "EN VIVO"
                : "FINAL"
          }

        </div>


      </div>

    `).join("");

}



// ======================================================
// STANDINGS
// ======================================================


function renderStandings() {

  const body =
    document.getElementById(
      "standingsBody"
    );


  const table =
    calculateStandings();


  body.innerHTML =
    table.map(
      (team, index) => `

        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            <strong>
              ${team.name}
            </strong>
          </td>

          <td>
            ${team.pj}
          </td>

          <td>
            ${team.pg}
          </td>

          <td>
            ${team.pe}
          </td>

          <td>
            ${team.pp}
          </td>

          <td>

            ${
              team.dg > 0
                ? "+"
                : ""
            }

            ${team.dg}

          </td>

          <td>
            <strong>
              ${team.pts}
            </strong>
          </td>

        </tr>

      `
    ).join("");

}



function calculateStandings() {

  const data =
    {};


  sportMatches()
    .filter(
      match =>
        match.status ===
        "finished"
    )

    .forEach(match => {

      const home =
        teamName(
          match.home_team
        );


      const away =
        teamName(
          match.away_team
        );


      if (!data[home]) {

        data[home] =
          newTeamTable(home);

      }


      if (!data[away]) {

        data[away] =
          newTeamTable(away);

      }


      const h =
        Number(
          match.home_score || 0
        );


      const a =
        Number(
          match.away_score || 0
        );


      data[home].pj++;

      data[away].pj++;


      data[home].gf += h;

      data[home].gc += a;


      data[away].gf += a;

      data[away].gc += h;


      if (h > a) {

        data[home].pg++;

        data[home].pts += 3;

        data[away].pp++;

      }

      else if (a > h) {

        data[away].pg++;

        data[away].pts += 3;

        data[home].pp++;

      }

      else {

        data[home].pe++;

        data[away].pe++;

        data[home].pts++;

        data[away].pts++;

      }

    });


  return Object
    .values(data)

    .map(team => {

      team.dg =
        team.gf -
        team.gc;

      return team;

    })

    .sort(
      (a,b) =>

        b.pts - a.pts ||

        b.dg - a.dg ||

        b.gf - a.gf

    );

}



function newTeamTable(name) {

  return {

    name,

    pj: 0,

    pg: 0,

    pe: 0,

    pp: 0,

    gf: 0,

    gc: 0,

    dg: 0,

    pts: 0

  };

}



// ======================================================
// SCORERS
// ======================================================


function renderScorers() {

  const container =
    document.getElementById(
      "scorersContent"
    );


  const goals =
    {};


  events

    .filter(
      event =>
        event.event_type ===
        "goal"
    )

    .forEach(event => {

      const player =
        event.player_name ||
        "Jugador";


      if (!goals[player]) {

        goals[player] = 0;

      }


      goals[player]++;

    });


  const ranking =
    Object
      .entries(goals)

      .sort(
        (a,b) =>
          b[1] - a[1]
      );


  if (!ranking.length) {

    container.innerHTML = `

      <div class="empty-state">

        <strong>
          Todavía no hay goleadores
        </strong>

      </div>

    `;

    return;

  }


  container.innerHTML =
    ranking.map(
      ([player,goals],index) => `

        <article class="scorer-card">


          <div class="scorer-position">

            ${index + 1}

          </div>


          <div>

            <strong>
              ${player}
            </strong>

            <small>
              Copa Raíces
            </small>

          </div>


          <div class="scorer-goals">

            ${goals}

          </div>


        </article>

      `
    )
    .join("");

}