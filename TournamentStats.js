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
async function parseTournamentStats(tour_id, tour_info, overview) {
    const headers = await getHeaders();
    
    const champ_name = tour_info.tournament.championshipName;
    const tour_name = tour_info.tournament.name;
    const tour_name_full = champ_name + " • " + tour_name;
    const start_time = new Date(tour_info.tournament.baseDate);
    const player_count = tour_info.tournament.registeredPlayers;
    let game_name = "";
    
    const players_per_match_max = tour_info.tournament.playersPerMatch;
    const rounds_count = tour_info.tournament.stepNbr;
    const round_limit = tour_info.tournament.gameMaxLength / 3600 / 24;
    let end_time = "";
    var match_count = 0;
    var timeout_matches = 0;
    var output = "";
    for (const step of overview.steps) {
        for (const match of step.matches) {
            const tableID = match.tableId;
            if (tableID === null) {
                continue;
            }
            try {
                const response = await fetch("https://boardgamearena.com/table/table/tableinfos.html?id=" + tableID, { headers });
                const info = await response.json();
                if (game_name == "") {
                    const postHeaders = headers ? new Headers(headers) : new Headers();
                    postHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                    let response = await fetch('https://boardgamearena.com/gamelist/gamelist/gameDetails.html', {
                        method: 'POST',
                        headers: postHeaders,
                        body: new URLSearchParams({ game: info.data.game_name })
                    });
                    const game_details = await response.json();
                    game_name = game_details.results.game_name;
                }
                match_count += 1;
                if (info.data.status != "archive") {
                    continue;
                }
                const is_timeout = match.endgameReason == "abandon_by_tournamenttimeout";
                const progress = is_timeout ? match.tableProgression : 100;
                const match_end = new Date(info.data.result.time_end);
                if (end_time === "" || end_time < match_end) {
                    end_time = match_end;
                }
                const time_limit = tour_info.tournament.gameOptions["204"].value;
                var player_output = "";
                var players = match.players;
                players.forEach(player => {
                    const playerInfo = tour_info.group.member[player.player_id] || tour_info.group.admin[player.player_id];
                    const pname = playerInfo.name;
                    const player_id = player.player_id; /* not the same as above */
                    const reflexion_time = info.data.result.stats.player.reflexion_time.values[player_id];
                    const remaining_time = time_limit - reflexion_time;
                    const points = player.points;
                    player_output += "\t" + pname + "\t" + remaining_time + "\t" + points;
                });
                output += tour_id + "\t" + tableID + "\t" + Number(is_timeout) + "\t" + progress + player_output + "\n";
                timeout_matches += is_timeout;
            } catch (error) {
                console.error("Error fetching table info for table " + tableID, error);
            }
        }
    }
    return tour_id + "\t" + tour_name_full + "\t\t" + game_name + "\t" + start_time.toLocaleString() + "\t" + end_time.toLocaleString() + "\t" + rounds_count + "\t" + round_limit + "\t" + match_count + "\t" + timeout_matches + "\t" + player_count + "\t" + players_per_match_max + "\n" + output;
}
async function parseTournamentResults(tour_id, tour_info, overview) {
    const headers = await getHeaders();
    
    const champ_name = tour_info.tournament.championshipName;
    const tour_name = tour_info.tournament.name;
    const tour_name_full = champ_name + " • " + tour_name;
    const start_time = new Date(tour_info.tournament.baseDate);
    const player_count = tour_info.tournament.registeredPlayers;

    const postHeaders = headers ? new Headers(headers) : new Headers();
    postHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    let response = await fetch('https://boardgamearena.com/gamepanel/gamepanel/getData.html', {
        method: 'POST',
        headers: postHeaders,
        body: new URLSearchParams({ game_id: tour_info.tournament.gameId, with_ranking_info: false })
    });
    const game_details = await response.json();
    const game_name = game_details.data.playerStats.game_name_displayed;
    var output = "";
    for (const player of overview.players) {
        output += player.displayRank + "\t" + player.name + "\t" + player.points + "\t" + player.played + "\t" + player.skipped + "\t" + player.average_opponent_points + "\t" + player.average_opponent_elo + "\t" + player.rank + "\n";
    }

    return tour_id + "\t" + start_time.toLocaleString() + "\t" + game_name + "\t" + tour_name_full + "\n" + output + "\n";
}
function exportTournamentStats() {
    const tours = document.getElementById("tournament_list").value.trim().split("\n");
    var exported = document.getElementById("export_textarea");
    var results = document.getElementById("results_textarea");
    exported.value = "Loading... 0/" + tours.length;
    results.value = "Loading... 0/" + tours.length;
    var loading = async () => {
        /* for every tournament parse stats and concatenate outputs */
        var exported_str = "";
        var results_str = "";
        const parser = new DOMParser();
        for (let i = 0; i < tours.length; ++i) {
            var tour_id = tours[i];
            /* fetch tournament overview via POST */
            const tokenHeaders = await getHeaders();
            const postHeaders = tokenHeaders ? new Headers(tokenHeaders) : new Headers();
            postHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            try {
                let response = await fetch('https://boardgamearena.com/tournament/view/getTournament.html', {
                    method: 'POST',
                    headers: postHeaders,
                    body: new URLSearchParams({ id: tour_id })
                });
                const tour_info = await response.json();
                response = await fetch('https://boardgamearena.com/tournament/view/getOverview.html', {
                    method: 'POST',
                    headers: postHeaders,
                    body: new URLSearchParams({ id: tour_id })
                });
                const overview = await response.json();
                exported_str = exported_str + await parseTournamentStats(tour_id, tour_info.data, overview.data);
                results_str = results_str + await parseTournamentResults(tour_id, tour_info.data, overview.data);
            } catch (err) {
                console.log("Error fetching/parsing tour " + tours[i] + "\n" + err);
                console.log(tour_info);
                console.log(overview);
                window.alert(tours[i] + "\n" + err);
            }
            exported.value = "Loading... " + (i+1) + "/" + tours.length;
            results.value = "Loading... " + (i+1) + "/" + tours.length;
        }
        exported.value = exported_str.trim();
        results.value = results_str.trim();
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
    tournamentlist.setAttribute("cols", "12");
    tournamentlist.setAttribute("rows", "24");
    tournamentlist.setAttribute("style", "display: block;");
    tournamentlist.value = m[1];
    toursdiv.appendChild(idsheader);
    toursdiv.appendChild(tournamentlist);

    var exportheader = document.createElement("h3");
    exportheader.innerText = "Tournament ID; Tournament Title; ; Game; Start; End; #Rounds; Time limit (days); #Matches; #Timeouts; #Competitors; #Players/match\n"
                            + "Tournament ID; Table ID; Timeout; Progress; Player1; Time1; Point1; Player2; Time2; Point2";
    exportheader.setAttribute("style", "text-transform: none;");

    var output = document.createElement("textarea");
    output.setAttribute("id", "export_textarea");
    output.setAttribute("cols", "136");
    output.setAttribute("rows", "10");
    output.setAttribute("style", "display: block;");
    output.value = "Press Start button to start the data collection.";

    var resultsheader = document.createElement("h3");
    resultsheader.innerText = "Tournament ID; Start Time; Game; Tournament Title\n"
                            + "Place; Player; Points; Played; Skipped; Opponents' points; Opponents' ELO; Player ELO";
    resultsheader.setAttribute("style", "text-transform: none;");

    var results = document.createElement("textarea");
    results.setAttribute("id", "results_textarea");
    results.setAttribute("cols", "136");
    results.setAttribute("rows", "10");
    results.setAttribute("style", "display: block;");
    results.value = "Press Start button to start the data collection.";

    var startBtn = document.createElement("button");
    startBtn.setAttribute("type", "button");
    startBtn.setAttribute("id", "startBtn");
    startBtn.setAttribute("class", "bgabutton bgabutton_blue");
    startBtn.setAttribute("onclick", "exportTournamentStats()");
    startBtn.setAttribute("style", "width: auto; margin: 10px 0;");
    startBtn.innerText = "Start";

    exportdiv.appendChild(exportheader);
    exportdiv.appendChild(output);
    exportdiv.appendChild(resultsheader);
    exportdiv.appendChild(results);
    exportdiv.appendChild(startBtn);
    document.querySelector("div.bga-progress-bar").parentNode.prepend(rootdiv);
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