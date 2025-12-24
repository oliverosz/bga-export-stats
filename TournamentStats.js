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
m = window.location.href.match(".*boardgamearena.com/tournament\\?id=(\\d+)");
if (m || confirm("It seems, you are not on a BGA tournament page.\nWould you still like to run the script?")) {
    try {
        displayStats();
    }
    catch(error) {
        alert("An error occurred:\n"+error);
    }
}
};void(0);