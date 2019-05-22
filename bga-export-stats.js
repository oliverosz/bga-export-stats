// ==UserScript==
// @name         BGA Player Stats Export
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  CSV Export for BGA user pages
// @author       oliverosz
// @match        https://boardgamearena.com/
// @grant        none
// ==/UserScript==

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

/* creates an Export button on user profile (may need to refresh page) */
window.onload = function() {
    /* tampermonkey doesn't support '#' in the url (see https://tampermonkey.net/documentation.php#_include), so check if on a table here before continuing. */
    if (window.location.href.includes("#!player")) {
        var statusDiv = document.querySelector("#player_status");
        var exportButton = document.createElement("input");
        exportButton.setAttribute("type", "button");
        exportButton.setAttribute("value", "Export stats");
        exportButton.setAttribute("id", "export_btn");
        statusDiv.appendChild(exportButton);
        document.getElementById("export_btn").addEventListener("click", exportStats, false);
    }
};