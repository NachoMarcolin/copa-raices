// ======================================================
// COPA RAÍCES
// PUBLIC APP
// ======================================================


let currentSport = "football";

let matches = [];
let events = [];

let publicRealtimeChannel = null;
let publicClockInterval = null;


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

  updateSportNavigation();

  renderEverything();

  setupRealtime();

  startPublicClock();

}


// ======================================================
// SUPABASE
// ======================================================


async function loadData() {

  try {

    if (
      typeof supabaseClient === "undefined"
    ) {

      console.error(
        "Supabase no está disponible."
      );

      clearData();

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

      clearData();

      return;

    }


    const {
      data: eventData,
      error: eventError
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


    if (eventError) {

      console.error(
        "Error cargando eventos:",
        eventError
      );

    }


    matches =
      matchData || [];


    events =
      eventData || [];

  }

  catch (error) {

    console.error(
      "Error cargando datos:",
      error
    );

    clearData();

  }

}


function clearData() {

  matches = [];

  events = [];

}


// ======================================================
// REALTIME
// ======================================================


function setupRealtime() {

  if (
    typeof supabaseClient === "undefined"
  ) {

    return;

  }


  if (publicRealtimeChannel) {

    return;

  }


  const reloadPublicData =
    async () => {

      await loadData();

      renderEverything();

    };


  publicRealtimeChannel =
    supabaseClient

      .channel(
        "copa-raices-public-results"
      )

      .on(

        "postgres_changes",

        {

          event: "*",

          schema: "public",

          table: "matches"

        },

        reloadPublicData

      )

      .on(

        "postgres_changes",

        {

          event: "*",

          schema: "public",

          table: "match_events"

        },

        reloadPublicData

      )

      .on(

        "postgres_changes",

        {

          event: "*",

          schema: "public",

          table: "teams"

        },

        reloadPublicData

      )

      .subscribe(
        status => {

          console.log(
            "Realtime:",
            status
          );

        }
      );

}


// ======================================================
// RELOJ PÚBLICO
// ======================================================


function startPublicClock() {

  if (publicClockInterval) {

    clearInterval(
      publicClockInterval
    );

  }


  publicClockInterval =
    setInterval(
      () => {

        renderLive();

        renderSchedule();

      },
      1000
    );

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


          updateSportNavigation();

          renderEverything();

        }
      );

    });

}


function updateSportNavigation() {

  const scorerButtons =
    document.querySelectorAll(
      '[data-section="scorers"]'
    );


  scorerButtons.forEach(
    button => {

      button.style.display =
        currentSport === "padel"
          ? "none"
          : "";

    }
  );


  const scorersSection =
    document.getElementById(
      "scorers"
    );


  if (
    currentSport === "padel" &&
    scorersSection &&
    scorersSection
      .classList
      .contains("active")
  ) {

    openSection(
      "live"
    );

  }

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
      match.sport ===
      currentSport
  );

}


// ======================================================
// TEAM HELPERS
// ======================================================


function initials(
  name = ""
) {

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      word =>
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


function getElapsedSeconds(
  match
) {

  let seconds =
    Number(
      match.elapsed_seconds ||
      0
    );


  if (
    match.clock_running &&
    match.clock_started_at
  ) {

    const startedAt =
      new Date(
        match.clock_started_at
      ).getTime();


    const now =
      Date.now();


    seconds +=
      Math.max(
        0,
        Math.floor(
          (now - startedAt) /
          1000
        )
      );

  }


  return seconds;

}


function getMinute(
  match
) {

  return Math.floor(
    getElapsedSeconds(
      match
    ) / 60
  );

}


function getClock(
  match
) {

  const totalSeconds =
    getElapsedSeconds(
      match
    );


  const minutes =
    Math.floor(
      totalSeconds / 60
    );


  const seconds =
    totalSeconds % 60;


  return (

    String(
      minutes
    ).padStart(
      2,
      "0"
    )

    +

    ":"

    +

    String(
      seconds
    ).padStart(
      2,
      "0"
    )

  );

}


function normalizeTime(
  time
) {

  if (!time) {

    return "--:--";

  }


  return time
    .slice(
      0,
      5
    );

}


// ======================================================
// PÁDEL
// ======================================================


function padelPointLabel(
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


function padelCurrentScore(
  match
) {

  if (
    match.padel_tiebreak
  ) {

    return {

      home:
        Number(
          match.padel_home_tiebreak ||
          0
        ),

      away:
        Number(
          match.padel_away_tiebreak ||
          0
        ),

      label:
        "TIE-BREAK"

    };

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


  return {

    home:
      padelPointLabel(
        homePoints
      ),

    away:
      padelPointLabel(
        awayPoints
      ),

    label:
      (
        homePoints === 3 &&
        awayPoints === 3
      )

        ? "PUNTO DE ORO"

        : "PUNTOS"

  };

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


// ======================================================
// LIVE
// ======================================================


function renderLive() {

  const container =
    document.getElementById(
      "liveMatches"
    );


  if (!container) {

    return;

  }


  const live =
    sportMatches()
      .filter(
        match =>
          match.status ===
          "live"
      );


  const count =
    document.getElementById(
      "liveMatchCount"
    );


  if (count) {

    count.textContent =
      live.length;

  }


  const counterText =
    document.getElementById(
      "liveCounterText"
    );


  if (counterText) {

    counterText.textContent =
      live.length

        ? `En vivo (${live.length})`

        : "Sin partidos en vivo";

  }


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
          liveCardHTML(
            match
          )
      )
      .join("");

}


// ======================================================
// LIVE CARD
// ======================================================


function liveCardHTML(
  match
) {

  if (
    match.sport === "padel"
  ) {

    return padelLiveCardHTML(
      match
    );

  }


  return footballLiveCardHTML(
    match
  );

}


// ======================================================
// FÚTBOL LIVE CARD
// ======================================================


function footballLiveCardHTML(
  match
) {

  const matchEvents =
    events

      .filter(
        event =>
          Number(
            event.match_id
          ) ===
          Number(
            match.id
          )
      )

      .filter(
        event =>
          event.event_type ===
          "goal"
      )

      .slice(
        -3
      );


  const eventsHTML =
    matchEvents.length

      ?

      matchEvents

        .map(
          event => `

            <div class="match-event">

              <div class="event-info">

                <span>
                  ⚽
                </span>

                <span class="event-minute">
                  ${event.minute}'
                </span>

                <span>
                  ${event.player_name || "Gol"}
                </span>

              </div>

            </div>

          `
        )

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

          ${

            match.group_name

              ? " · " +
                match.group_name

              : ""

          }

        </span>


        <span class="match-clock">

          ${match.period || ""}

          ·

          ${getClock(match)}

        </span>

      </div>


      <div class="match-score-layout">


        <div class="match-team">

          <div class="team-crest">

            ${initials(
              teamName(
                match.home_team
              )
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
              teamName(
                match.away_team
              )
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
// PÁDEL LIVE CARD
// ======================================================


function padelLiveCardHTML(
  match
) {

  const point =
    padelCurrentScore(
      match
    );


  const homeGames =
    padelHomeGames(
      match
    );


  const awayGames =
    padelAwayGames(
      match
    );


  return `

    <article class="
      live-match-card
      padel-live-card
    ">


      <div class="match-card-top">

        <span class="live-label">
          EN VIVO
        </span>


        <span class="match-location">

          ${match.court || "Cancha"}

          ${

            match.group_name

              ? " · " +
                match.group_name

              : ""

          }

        </span>


        <span class="match-clock">

          SET ÚNICO

          ·

          ${getClock(match)}

        </span>

      </div>


      <div class="padel-live-score">


        <div class="
          padel-player-name
          padel-player-home
        ">

          ${teamName(
            match.home_team
          )}

        </div>


        <div class="
          padel-player-name
          padel-player-away
        ">

          ${teamName(
            match.away_team
          )}

        </div>


        <div class="
          padel-score-label
          padel-games-label
        ">
          GAMES
        </div>


        <strong class="
          padel-game-number
          padel-home-game
        ">

          ${homeGames}

        </strong>


        <strong class="
          padel-game-number
          padel-away-game
        ">

          ${awayGames}

        </strong>


        <div class="
          padel-score-label
          padel-point-label
        ">

          ${point.label}

        </div>


        <strong class="
          padel-current-point
          padel-home-point
        ">

          ${point.home}

        </strong>


        <strong class="
          padel-current-point
          padel-away-point
        ">

          ${point.away}

        </strong>


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


  if (!container) {

    return;

  }


  const upcoming =
    sportMatches()

      .filter(
        match =>
          match.status ===
          "pending"
      )

      .slice(
        0,
        4
      );


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
    upcoming
      .map(
        match => `

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

                ${

                  match.group_name

                    ? " · " +
                      match.group_name

                    : ""

                }

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

        `
      )

      .join("");

}


// ======================================================
// SIDE SCHEDULE
// ======================================================


function renderSchedule() {

  const container =
    document.getElementById(
      "daySchedule"
    );


  if (!container) {

    return;

  }


  const list =
    sportMatches()
      .slice(
        0,
        7
      );


  const today =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        weekday:
          "long",

        day:
          "numeric",

        month:
          "long"
      }
    )
    .format(
      new Date()
    );


  const scheduleDate =
    document.getElementById(
      "scheduleDate"
    );


  if (scheduleDate) {

    scheduleDate.textContent =

      today
        .charAt(0)
        .toUpperCase()

      +

      today
        .slice(1);

  }


  if (!list.length) {

    container.innerHTML = `

      <div class="admin-empty">
        Sin partidos.
      </div>

    `;

    return;

  }


  container.innerHTML =
    list
      .map(
        match => {

          const live =
            match.status ===
            "live";


          const finished =
            match.status ===
            "finished";


          let scoreHTML =
            "";


          if (
            match.sport ===
            "padel"
          ) {

            const point =
              padelCurrentScore(
                match
              );


            if (live) {

              scoreHTML = `

                <div>

                  <span class="schedule-score">

                    ${padelHomeGames(match)}

                    -

                    ${padelAwayGames(match)}

                  </span>

                  <span class="schedule-live">

                    ${point.home}
                    -
                    ${point.away}

                  </span>

                </div>

              `;

            }

            else if (finished) {

              scoreHTML = `

                <span class="schedule-score">

                  ${padelHomeGames(match)}

                  -

                  ${padelAwayGames(match)}

                </span>

              `;

            }

            else {

              scoreHTML = `

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

              `;

            }

          }

          else {

            if (
              live ||
              finished
            ) {

              scoreHTML = `

                <div>

                  <span class="schedule-score">

                    ${match.home_score ?? 0}

                    -

                    ${match.away_score ?? 0}

                  </span>

                  ${

                    live

                      ? `

                        <span class="schedule-live">
                          EN VIVO
                        </span>

                      `

                      : ""

                  }

                </div>

              `;

            }

            else {

              scoreHTML = `

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

              `;

            }

          }


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

                    ? match.court ||
                      ""

                    : normalizeTime(
                        match.start_time
                      )

                }

              </span>


              <span class="schedule-game">

                ${match.court || ""}

              </span>


              ${scoreHTML}


            </div>

          `;

        }
      )

      .join("");

}


// ======================================================
// FIXTURE
// ======================================================


function renderFixture() {

  const container =
    document.getElementById(
      "fixtureContent"
    );


  if (!container) {

    return;

  }


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
    list

      .map(
        match => {

          const isPadel =
            match.sport ===
            "padel";


          const homeScore =
            isPadel

              ? padelHomeGames(
                  match
                )

              : match.home_score ??
                0;


          const awayScore =
            isPadel

              ? padelAwayGames(
                  match
                )

              : match.away_score ??
                0;


          let resultText =
            "";


          if (
            match.status ===
            "pending"
          ) {

            resultText =
              "Próximo";

          }

          else if (
            match.status ===
            "live"
          ) {

            if (isPadel) {

              const point =
                padelCurrentScore(
                  match
                );


              resultText =
                `EN VIVO · ${point.home}-${point.away}`;

            }

            else {

              resultText =
                "EN VIVO";

            }

          }

          else {

            resultText =
              "FINAL";

          }


          return `

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

                    ${teamName(
                      match.home_team
                    )}

                  </span>


                  ${

                    match.status !==
                    "pending"

                      ? `

                        <strong class="
                          fixture-team-score
                        ">

                          ${homeScore}

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

                    ${teamName(
                      match.away_team
                    )}

                  </span>


                  ${

                    match.status !==
                    "pending"

                      ? `

                        <strong class="
                          fixture-team-score
                        ">

                          ${awayScore}

                        </strong>

                      `

                      : ""

                  }

                </div>


              </div>


              <div class="fixture-result">

                ${resultText}

              </div>


            </div>

          `;

        }
      )

      .join("");

}


// ======================================================
// STANDINGS
// ======================================================


function renderStandings() {

  const body =
    document.getElementById(
      "standingsBody"
    );


  if (!body) {

    return;

  }


  const table =
    calculateStandings();


  if (!table.length) {

    body.innerHTML = `

      <tr>

        <td
          colspan="8"
          style="
            text-align:center;
            padding:30px;
          "
        >
          Todavía no hay partidos finalizados.
        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    table

      .map(
        (
          team,
          index
        ) => `

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
      )

      .join("");

}


// ======================================================
// CALCULATE STANDINGS
// ======================================================


function calculateStandings() {

  const data =
    {};


  sportMatches()

    .filter(
      match =>
        match.status ===
        "finished"
    )

    .forEach(
      match => {

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
            newTeamTable(
              home
            );

        }


        if (!data[away]) {

          data[away] =
            newTeamTable(
              away
            );

        }


        const h =
          Number(

            match.sport ===
            "padel"

              ? padelHomeGames(
                  match
                )

              : match.home_score ||
                0

          );


        const a =
          Number(

            match.sport ===
            "padel"

              ? padelAwayGames(
                  match
                )

              : match.away_score ||
                0

          );


        data[home].pj++;

        data[away].pj++;


        data[home].gf +=
          h;

        data[home].gc +=
          a;


        data[away].gf +=
          a;

        data[away].gc +=
          h;


        if (h > a) {

          data[home].pg++;

          data[home].pts +=
            3;

          data[away].pp++;

        }

        else if (a > h) {

          data[away].pg++;

          data[away].pts +=
            3;

          data[home].pp++;

        }

        else {

          data[home].pe++;

          data[away].pe++;

          data[home].pts++;

          data[away].pts++;

        }

      }
    );


  return Object

    .values(
      data
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

    );

}


// ======================================================
// NEW TEAM TABLE
// ======================================================


function newTeamTable(
  name
) {

  return {

    name,

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


// ======================================================
// SCORERS
// ======================================================


function renderScorers() {

  const container =
    document.getElementById(
      "scorersContent"
    );


  if (!container) {

    return;

  }


  if (
    currentSport ===
    "padel"
  ) {

    container.innerHTML =
      "";

    return;

  }


  const footballMatchIds =
    new Set(

      matches

        .filter(
          match =>
            match.sport ===
            "football"
        )

        .map(
          match =>
            Number(
              match.id
            )
        )

    );


  const goals =
    {};


  events

    .filter(
      event =>
        event.event_type ===
        "goal"
    )

    .filter(
      event =>
        footballMatchIds.has(
          Number(
            event.match_id
          )
        )
    )

    .forEach(
      event => {

        const player =
          event.player_name ||
          "Jugador";


        if (!goals[player]) {

          goals[player] =
            0;

        }


        goals[player]++;

      }
    );


  const ranking =
    Object

      .entries(
        goals
      )

      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
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
    ranking

      .map(
        (
          [
            player,
            goals
          ],
          index
        ) => `

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

// ======================================================
// POSICIONES POR GRUPOS
// COPA RAÍCES
// ======================================================


// Sobrescribimos loadData para traer también
// el grupo guardado en cada equipo.

async function loadData() {

  try {

    if (
      typeof supabaseClient ===
      "undefined"
    ) {

      console.error(
        "Supabase no está disponible."
      );

      clearData();

      return;

    }


    const {
      data: matchData,
      error: matchError
    } =
      await supabaseClient

        .from(
          "matches"
        )

        .select(`

          *,

          home_team:teams!matches_home_team_id_fkey(
            id,
            name,
            logo_url,
            group_name
          ),

          away_team:teams!matches_away_team_id_fkey(
            id,
            name,
            logo_url,
            group_name
          )

        `)

        .order(
          "start_time",
          {
            ascending:
              true
          }
        );


    if (matchError) {

      console.error(
        "Error cargando partidos:",
        matchError
      );

      clearData();

      return;

    }


    const {
      data: eventData,
      error: eventError
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


    if (eventError) {

      console.error(
        "Error cargando eventos:",
        eventError
      );

    }


    matches =
      matchData || [];


    events =
      eventData || [];

  }

  catch (error) {

    console.error(
      "Error cargando datos:",
      error
    );


    clearData();

  }

}


// ======================================================
// NORMALIZAR NOMBRE DE GRUPO
// ======================================================


function normalizeGroupName(
  group
) {

  const value =
    String(
      group || ""
    )
    .trim();


  if (!value) {

    return "General";

  }


  const clean =
    value
      .replace(
        /^grupo\s+/i,
        ""
      )
      .trim();


  return (
    "Grupo " +
    clean.toUpperCase()
  );

}


// ======================================================
// OBTENER GRUPO DE UN PARTIDO
// ======================================================


function getMatchGroup(
  match
) {

  const homeGroup =
    match.home_team
      ?.group_name;


  const awayGroup =
    match.away_team
      ?.group_name;


  return normalizeGroupName(

    match.group_name ||

    homeGroup ||

    awayGroup ||

    "General"

  );

}


// ======================================================
// CALCULAR POSICIONES POR GRUPO
// ======================================================


function calculateStandingsByGroup() {

  const groups =
    {};


  const sportList =
    sportMatches();


  // --------------------------------------
  // PRIMERO CREAMOS TODOS LOS EQUIPOS
  // Aunque todavía tengan 0 partidos.
  // --------------------------------------

  sportList.forEach(
    match => {

      const group =
        getMatchGroup(
          match
        );


      if (
        !groups[group]
      ) {

        groups[group] =
          {};

      }


      const homeName =
        teamName(
          match.home_team
        );


      const awayName =
        teamName(
          match.away_team
        );


      if (
        !groups[group][
          homeName
        ]
      ) {

        groups[group][
          homeName
        ] =
          newTeamTable(
            homeName
          );

      }


      if (
        !groups[group][
          awayName
        ]
      ) {

        groups[group][
          awayName
        ] =
          newTeamTable(
            awayName
          );

      }

    }
  );


  // --------------------------------------
  // AHORA SUMAMOS SOLO LOS FINALIZADOS
  // --------------------------------------

  sportList

    .filter(
      match =>
        match.status ===
        "finished"
    )

    .forEach(
      match => {

        const group =
          getMatchGroup(
            match
          );


        if (
          !groups[group]
        ) {

          groups[group] =
            {};

        }


        const home =
          teamName(
            match.home_team
          );


        const away =
          teamName(
            match.away_team
          );


        if (
          !groups[group][home]
        ) {

          groups[group][home] =
            newTeamTable(
              home
            );

        }


        if (
          !groups[group][away]
        ) {

          groups[group][away] =
            newTeamTable(
              away
            );

        }


        const h =
          Number(

            match.sport ===
            "padel"

              ? padelHomeGames(
                  match
                )

              : match.home_score ||
                0

          );


        const a =
          Number(

            match.sport ===
            "padel"

              ? padelAwayGames(
                  match
                )

              : match.away_score ||
                0

          );


        const homeTeam =
          groups[group][home];


        const awayTeam =
          groups[group][away];


        homeTeam.pj++;

        awayTeam.pj++;


        homeTeam.gf +=
          h;

        homeTeam.gc +=
          a;


        awayTeam.gf +=
          a;

        awayTeam.gc +=
          h;


        if (
          h > a
        ) {

          homeTeam.pg++;

          homeTeam.pts +=
            3;


          awayTeam.pp++;

        }

        else if (
          a > h
        ) {

          awayTeam.pg++;

          awayTeam.pts +=
            3;


          homeTeam.pp++;

        }

        else {

          homeTeam.pe++;

          awayTeam.pe++;


          homeTeam.pts++;

          awayTeam.pts++;

        }

      }
    );


  // --------------------------------------
  // CONVERTIR Y ORDENAR CADA GRUPO
  // --------------------------------------

  const result =
    {};


  Object
    .entries(
      groups
    )
    .forEach(
      ([
        group,
        teams
      ]) => {

        result[group] =
          Object

            .values(
              teams
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

                a.name
                  .localeCompare(
                    b.name,
                    "es"
                  )

            );

      }
    );


  return result;

}


// ======================================================
// RENDER DE POSICIONES POR GRUPO
// ======================================================


function renderStandings() {

  const section =
    document.getElementById(
      "standings"
    );


  if (!section) {

    return;

  }


  let container =
    document.getElementById(
      "standingsGroups"
    );


  // La primera vez reemplazamos
  // la tabla original.

  if (!container) {

    const originalCard =
      section.querySelector(
        ".standings-card"
      );


    if (!originalCard) {

      return;

    }


    container =
      document.createElement(
        "div"
      );


    container.id =
      "standingsGroups";


    container.className =
      "standings-groups";


    originalCard.replaceWith(
      container
    );

  }


  const groups =
    calculateStandingsByGroup();


  const groupNames =
    Object
      .keys(
        groups
      )
      .sort(
        (
          a,
          b
        ) => {

          if (
            a === "General"
          ) {

            return 1;

          }


          if (
            b === "General"
          ) {

            return -1;

          }


          return a.localeCompare(
            b,
            "es"
          );

        }
      );


  if (
    !groupNames.length
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <strong>
          Todavía no hay equipos
        </strong>

      </div>

    `;


    return;

  }


  container.innerHTML =
    groupNames

      .map(
        groupName => {

          const table =
            groups[
              groupName
            ];


          return `

            <section class="
              standings-group
            ">


              <div class="
                standings-group-title
              ">

                ${groupName}

              </div>


              <div class="
                standings-card
              ">


                <table>


                  <thead>

                    <tr>

                      <th>
                        #
                      </th>

                      <th>
                        Equipo
                      </th>

                      <th>
                        PJ
                      </th>

                      <th>
                        PG
                      </th>

                      <th>
                        PE
                      </th>

                      <th>
                        PP
                      </th>

                      <th>
                        DG
                      </th>

                      <th>
                        PTS
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    ${

                      table
                        .map(
                          (
                            team,
                            index
                          ) => `

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

                                  team.dg >
                                  0

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
                        )
                        .join("")

                    }

                  </tbody>


                </table>


              </div>


            </section>

          `;

        }
      )

      .join("");


  // CSS agregado automáticamente
  // para no tocar styles.css.

  if (
    !document.getElementById(
      "standingsGroupStyles"
    )
  ) {

    const style =
      document.createElement(
        "style"
      );


    style.id =
      "standingsGroupStyles";


    style.textContent = `

      .standings-groups {

        display:
          grid;

        gap:
          30px;

      }


      .standings-group {

        min-width:
          0;

      }


      .standings-group-title {

        margin-bottom:
          10px;

        color:
          var(--navy);

        font-family:
          "League Spartan",
          sans-serif;

        font-size:
          20px;

        font-weight:
          900;

        letter-spacing:
          .5px;

        text-transform:
          uppercase;

      }


      .standings-group
      .standings-card {

        width:
          100%;

        background:
          #ffffff;

      }


      @media (
        max-width: 540px
      ) {

        .standings-groups {

          gap:
            24px;

        }


        .standings-group-title {

          font-size:
            18px;

        }

      }

    `;


    document.head.appendChild(
      style
    );

  }

}

// ======================================================
// GOLEADORES CON EQUIPO
// ======================================================


function getPublicTeamNameById(
  teamId
) {

  for (
    const match of matches
  ) {

    if (
      Number(
        match.home_team?.id
      ) ===
      Number(
        teamId
      )
    ) {

      return (
        match.home_team?.name ||
        "Equipo"
      );

    }


    if (
      Number(
        match.away_team?.id
      ) ===
      Number(
        teamId
      )
    ) {

      return (
        match.away_team?.name ||
        "Equipo"
      );

    }

  }


  return "Equipo";

}


// ======================================================
// RENDER GOLEADORES
// ======================================================


function renderScorers() {

  const container =
    document.getElementById(
      "scorersContent"
    );


  if (!container) {

    return;

  }


  if (
    currentSport ===
    "padel"
  ) {

    container.innerHTML =
      "";

    return;

  }


  const footballMatchIds =
    new Set(

      matches

        .filter(
          match =>
            match.sport ===
            "football"
        )

        .map(
          match =>
            Number(
              match.id
            )
        )

    );


  const scorers =
    {};


  events

    .filter(
      event =>
        event.event_type ===
        "goal"
    )

    .filter(
      event =>
        footballMatchIds.has(
          Number(
            event.match_id
          )
        )
    )

    .forEach(
      event => {

        const player =
          event.player_name ||
          "Jugador";


        const teamId =
          Number(
            event.team_id
          );


        const key =
          `${player}__${teamId}`;


        if (
          !scorers[key]
        ) {

          scorers[key] = {

            player,

            teamId,

            goals:
              0

          };

        }


        scorers[key].goals++;

      }
    );


  const ranking =
    Object

      .values(
        scorers
      )

      .sort(
        (
          a,
          b
        ) =>
          b.goals -
          a.goals
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
    ranking

      .map(
        (
          scorer,
          index
        ) => `

          <article class="scorer-card">


            <div class="scorer-position">

              ${index + 1}

            </div>


            <div>

              <strong>

                ${scorer.player}

              </strong>


              <small>

                ${getPublicTeamNameById(
                  scorer.teamId
                )}

              </small>

            </div>


            <div class="scorer-goals">

              ${scorer.goals}

            </div>


          </article>

        `
      )

      .join("");

}