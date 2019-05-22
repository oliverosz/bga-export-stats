## Description

On BGA - [boardgamearena.com](https://boardgamearena.com), this script adds an Export Stats button to player profile pages. (You may need to refresh the page for the button to appear.) The stats appear at the top of the page in CSV format, the column headers are in the title:
- Player Name
- Game Name
- ELO
- Rank
- Matches
- Wins

The first record contains overall player stats: prestige, total matches, total wins.

## Installation

The easiest usage is to install the userscript via Tampermonkey or a similar userscript manager. If you need help with this, follow the installation guide on [Greasy Fork](https://greasyfork.org/en/scripts/383341-bga-player-stats-export)

If you don't want to use a script manager, you can create a bookmarklet. Create a bookmark with the following code as an url, and open it from your browser when you're on a BGA player profile.

````
javascript:{
    /* generates CSV from user data and displays it at the top */
    function exportStats() {
        var output = "";
        var player = document.querySelector("#player_name").innerText;
        var prestige = document.querySelector("#pageheader_prestige").innerText.trim();
        /* overall stats */
        var matches = 0;
        var wins = 0;
        var gameDivs = document.querySelector("#pagesection_prestige").getElementsByClassName("row")[0].getElementsByClassName("palmares_game");
        for (var i = 0; i < gameDivs.length; i++) {
            var game = gameDivs[i].getElementsByClassName("gamename")[0].innerText;
            var details = gameDivs[i].getElementsByClassName("palmares_details")[0].innerText;
            var arr = details.match(/(\d+)/g);
            var played = Number(arr[0]);
            var won = Number(arr[1]);
            matches += played;
            wins += won;
            var elo = gameDivs[i].getElementsByClassName("gamerank_value")[0].innerText;
            var rank = gameDivs[i].getElementsByClassName("gamerank_no")[0].innerText.match(/(\d+)?/)[0];
            output += player + ";" + game + ";" + elo + ";" + rank + ";" + played + ";" + won + "\n";
        }
        /* prepend overall player stats */
        output = player + ";Prestige;" + prestige + ";;" + matches + ";" + wins + "\n" + output;
        var div = document.createElement("div");
        div.setAttribute("id", "pagesection_export");
        div.className = "pagesection";
        var header = document.createElement("h3");
        header.innerText = "Player Name;Game Name;ELO;Rank;Matches;Wins"; /* column headers in the box title */
        var exported = document.createElement("div");
        /* select all text when clicked */
        exported.setAttribute("style", "-webkit-touch-callout: all; -webkit-user-select: all; -khtml-user-select: all; -moz-user-select: all; -ms-user-select: all; user-select: all;");
        exported.innerText = output;
        div.appendChild(header);
        div.appendChild(exported);
        document.querySelector("#pageheader").parentNode.prepend(div);
    }
    var statusDiv = document.querySelector("#player_status");
    var exportButton = document.createElement("input");
    exportButton.setAttribute("type", "button");
    exportButton.setAttribute("value", "Export stats");
    exportButton.setAttribute("id", "export_btn");
    statusDiv.appendChild(exportButton);
    document.getElementById("export_btn").addEventListener("click", exportStats, false);
};void(0);
````
