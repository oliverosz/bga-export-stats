javascript:{
async function getHeaders() {
    return fetch("https://boardgamearena.com", { method: "GET" })
    .then(response => { return response.text() })
    .then(response => {
        const regex = /requestToken:\s+'([^']+)'/;
        const match = response.match(regex);
        if (!match || match.length < 2) {
            console.error("Failed to extract BGA request token from response");
        }
        return new Headers([["x-request-token", match[1]]]);
    })
    .catch((error) => {
        console.error("Error fetching BGA headers:", error);
        return null;
    })
}
async function displayStats() {
    const headers = await getHeaders();
    var timeouts = new Map();
    var matches = document.querySelectorAll("div.v2tournament__encounter");
    for (const match of matches) {
        if (match.classList.contains("v2tournament__encounter--status-skipped")) {
            continue;
        }
        var title = match.querySelector("a.v2tournament__encounter-title");
        const tableID = title.getAttribute("href").match("table=(\\d+)")[1];
        try {
            const response = await fetch("https://boardgamearena.com/table/table/tableinfos.html?id="+tableID, { headers });
            const info = await response.json();
            const end_reason = info.data.result.endgame_reason;
            if (end_reason == "abandon_by_tournamenttimeout") {
                title.setAttribute("style", "background:#f88; color:#000;");
            }
            const time_limit = info.data.options["204"].value;
            var players = match.querySelectorAll("div.v2tournament__encounter-player");
            players.forEach(player => {
                const player_id = player.getAttribute("data-tournament-player-id");
                const reflexion_time = info.data.result.stats.player.reflexion_time.values[player_id];
                const remaining_time = Math.floor((time_limit - reflexion_time) / 3600);
                var node = document.createElement("div");
                node.innerText = remaining_time + "h";
                if (remaining_time < 0) {
                    node.setAttribute("style", "color: red");
                    timeouts.set(player_id, timeouts.get(player_id) + 1 || 1);
                }
                player.appendChild(node);
            });
        } catch (error) {
            console.error("Error fetching table info", error);
        }
    }
    var statsTable = document.querySelector("div.v2tournament__players-stats-table > table");
    var colHead = document.createElement("th");
    colHead.innerText = "Timeouts";
    statsTable.querySelector("thead > tr").appendChild(colHead);
    statsTable.querySelectorAll("tbody > tr").forEach(row => {
        const player_id = row.querySelector("a.playername").getAttribute("href").match(/id=(\d+)/)[1];
        var cell = document.createElement("td");
        cell.innerText = timeouts.get(player_id) || 0;
        if (cell.innerText > 0) {
            cell.setAttribute("style", "color: red");
        }
        row.append(cell);
    });
}
function runDisplayStats() {
    displayStats();
}
async function parseTournamentStats(tour_id, tour_page) {
    var output = "";
    const headers = await getHeaders();
    const tour_name_full = tour_page.querySelector("div.tournaments-presentation__title-tournament").innerText;
    /*const champ_name = tour_name_full.split("•")[0].trim();
    const tour_name = tour_name_full.split("•")[1].trim();*/
    const game_name = tour_page.querySelector("div.tournaments-presentation__title-game > a").innerText;
    const start_time = new Date(tour_page.querySelector("div.tournaments-presentation__subtitle-value > div.localDate").innerText * 1000);
    const player_count = tour_page.querySelector("div.tournaments-presentation__subtitle-block-players > div > b").innerText;
    let end_time = "";
    let rounds = 0;
    let round_limit = 0;
    var data_rows = tour_page.querySelectorAll("div.tournaments-option");
    rounds = data_rows[6].innerText.match("(\\d+)")[1];
    round_limit = data_rows[7].innerText.match("(\\d+)")[1];
    /*for (const row of data_rows) {
        if (row.innerText.startsWith("Játszmák száma") || row.innerText.startsWith("Number of matches")) {
            rounds = row.innerText.match("(\\d+)")[1];
        }
        if (row.innerText.startsWith("Játék maximális időtartama") || row.innerText.startsWith("Game maximum duration")) {
            round_limit = row.innerText.match("(\\d+)")[1];
        }
    }*/
    var matches = tour_page.querySelectorAll("div.v2tournament__encounter");
    var timeout_matches = 0;
    for (const match of matches) {
        if (match.classList.contains("v2tournament__encounter--status-skipped")) {
            continue;
        }
        var title = match.querySelector("a.v2tournament__encounter-title");
        const tableID = title.getAttribute("href").match("table=(\\d+)")[1];
        try {
            const response = await fetch("https://boardgamearena.com/table/table/tableinfos.html?id="+tableID, { headers });
            const info = await response.json();
            if (info.data.status != "archive") {
                continue;
            }
            const is_timeout = info.data.result.endgame_reason == "abandon_by_tournamenttimeout";
            const progress = is_timeout ? info.data.progression : 100;
            const match_end = new Date(info.data.result.time_end);
            if (end_time === "" || end_time < match_end) {
                end_time = match_end;
            }
            const time_limit = info.data.options["204"].value;
            var player_output = "";
            var players = match.querySelectorAll("div.v2tournament__encounter-player");
            players.forEach(player => {
                const pname = player.querySelector("a.playername").innerText;
                const player_id = player.getAttribute("data-tournament-player-id");
                const reflexion_time = info.data.result.stats.player.reflexion_time.values[player_id];
                const remaining_time = time_limit - reflexion_time;
                const points = Number(player.querySelector("div.v2tournament__encounter-player-points").innerText);
                player_output += "\t" + pname + "\t" + remaining_time + "\t" + points;
            });
            output += tour_id + "\t" + tableID + "\t" + Number(is_timeout) + "\t" + progress + player_output + "\n";
            timeout_matches += is_timeout;
        } catch (error) {
            console.error("Error fetching table info for table " + tableID, error);
        }
    }
    return tour_id + "\t" + tour_name_full + "\t\t" + game_name + "\t" + start_time.toLocaleString() + "\t" + end_time.toLocaleString() + "\t" + rounds + "\t" + round_limit + "\t" + matches.length + "\t" + timeout_matches + "\t" + player_count + "\n" + output;
}
function exportTournamentStats() {
    var exported = document.getElementById("export_textarea");
    exported.value = "Loading... ";
    var loading = async () => {
        /* for every tournament parse stats and concatenate outputs */
        var exported_str = "";
        const parser = new DOMParser();
        const tours = document.getElementById("tournament_list").value.trim().split("\n");
        for (let i = 0; i < tours.length; ++i) {
            var tour_id = tours[i];
            const response = await fetch('https://boardgamearena.com/tournament?id='+tour_id);
            const html_str = await response.text();
            const doc = parser.parseFromString(html_str, "text/html");
            try {
                exported_str = exported_str + await parseTournamentStats(tour_id, doc);
            } catch (err) {
                console.log(tours[i] + "\n" + err);
                console.log(doc);
                window.alert(tours[i] + "\n" + err);
            }
            exported.value = "Loading... " + (i+1) + "/" + tours.length;
        }
        exported.value = exported_str.trim();
    };
    loading();
}
function displayExportSection() {
    var rootdiv = document.createElement("div");
    rootdiv.className = "pageheader";
    
    const divStyle = "float: left; margin: 0 10px;";
    var toursdiv = document.createElement("div");
    toursdiv.setAttribute("style", divStyle);
    var exportdiv = document.createElement("div");
    exportdiv.setAttribute("style", divStyle);
    rootdiv.appendChild(toursdiv);
    rootdiv.appendChild(exportdiv);

    var idsheader = document.createElement("h3");
    idsheader.innerText = "Tournament ID";
    idsheader.setAttribute("style", "text-transform: none;");

    var tournamentlist = document.createElement("textarea");
    tournamentlist.setAttribute("id", "tournament_list");
    tournamentlist.setAttribute("cols", "50");
    tournamentlist.setAttribute("rows", "10");
    tournamentlist.setAttribute("style", "display: block;");
    tournamentlist.value = m[1];
    toursdiv.appendChild(idsheader);
    toursdiv.appendChild(tournamentlist);

    var checkBtn = document.createElement("button");
    checkBtn.setAttribute("type", "button");
    checkBtn.setAttribute("id", "check_btn");
    checkBtn.setAttribute("class", "bgabutton bgabutton_blue");
    checkBtn.setAttribute("onclick", "runDisplayStats()");
    checkBtn.setAttribute("style", "width: auto; margin: 10px 10px 10px 10px;");
    checkBtn.innerText = "Display timeouts here";
    toursdiv.appendChild(checkBtn);

    var exportheader = document.createElement("h3");
    exportheader.innerText = "Tournament ID; Table ID; Timeout; Progress; Player1; Time1; Point1; Player2; Time2; Point2";
    exportheader.setAttribute("style", "text-transform: none;");

    var output = document.createElement("textarea");
    output.setAttribute("id", "export_textarea");
    output.setAttribute("cols", "100");
    output.setAttribute("rows", "10");
    output.setAttribute("style", "display: block;");
    output.value = "Press Start button to start the data collection."; 

    var startBtn = document.createElement("button");
    startBtn.setAttribute("type", "button");
    startBtn.setAttribute("id", "startBtn");
    startBtn.setAttribute("class", "bgabutton bgabutton_blue");
    startBtn.setAttribute("onclick", "exportTournamentStats()");
    startBtn.setAttribute("style", "width: auto; margin: 10px 0;");
    startBtn.innerText = "Start";

    exportdiv.appendChild(exportheader);
    exportdiv.appendChild(output);
    exportdiv.appendChild(startBtn);
    document.querySelector("div.tournaments-presentation").parentNode.prepend(rootdiv);
}
m = window.location.href.match(".*boardgamearena.com/tournament\\?id=(\\d+)");
if (m || confirm("It seems, you are not on a BGA tournament page.\nWould you still like to run the script?")) {
    try {
        displayExportSection();
    }
    catch(error) {
        alert("An error occurred:\n"+error);
    }
}
};void(0);