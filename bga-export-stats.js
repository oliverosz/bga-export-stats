javascript:{
/* generates CSV from user data and displays it at the top */
function exportStats() {
    var output = "";
    var player = document.querySelector("#player_name").innerText;
    /* overall stats */
    var prestige = document.querySelector("#pageheader_prestige").innerText.trim().replace('k', '000');
    var karma = document.querySelector(".progressbar_label").getElementsByClassName("value")[0].innerText.replace('%','');
    var matches = 0;
    var wins = 0;
    var gameDivs = document.querySelector("#pagesection_prestige").getElementsByClassName("row")[0].getElementsByClassName("palmares_game");
    var penalties = document.querySelector("#pagesection_reputation").getElementsByClassName("row-value")[0].innerText.match(/(\d+)/g);
    var abandoned = penalties[0];
    var timeout = penalties[1];
    var recent = penalties[2];
    /* days since last online */
    var lastSeenStr = document.querySelector("#last_seen").innerText;
    var lastSeenDays = 0;
    var lastSeenMatch = lastSeenStr.match(/(\d+|NaN)? (.*)/);
    if (lastSeenMatch[1] == "NaN")
        lastSeenDays = 0;
    else if (lastSeenMatch[1] !== undefined)
        lastSeenDays = Number(lastSeenMatch[1]);
    else
        lastSeenDays = 1;
    if (String(lastSeenMatch[2]).search("év|year") != -1) {
        lastSeenDays *= 365;
    } else if (String(lastSeenMatch[2]).search("hónap|month") != -1) {
        lastSeenDays *= 30;
    } else if (String(lastSeenMatch[2]).search("(mn|h|perc|óra) (ezelőtt|ago)") != -1) {
        lastSeenDays = 0;
    }
    /* stats per game */
    for (var i = 0; i < gameDivs.length; i++) {
        var game = gameDivs[i].getElementsByClassName("gamename")[0].innerText;
        var details = gameDivs[i].getElementsByClassName("palmares_details")[0].innerText;
        var arr = details.match(/(\d+[\s0-9]*)/g);
        var played = Number(arr[0].replace(/\s/g, ''));
        var won = Number(arr[1].replace(/\s/g, ''));
        matches += played;
        wins += won;
        var elo = gameDivs[i].getElementsByClassName("gamerank_value")[0].innerText;
        var rank = "";
        var rankStr = gameDivs[i].getElementsByClassName("gamerank_no")[0];
        if (rankStr) rank = rankStr.innerText.match(/(\d+)?/)[0];
        output += player + ";" + game + ";" + elo + ";" + rank + ";" + played + ";" + won + "\n";
    }
    /* prepend overall player stats */
    output = player + ";Prestige;" + prestige + ";" + karma + ";" + matches + ";" + wins + "\n" + 
             player + ";Recent games;" + abandoned + ";" + timeout + ";" + recent + ";" + lastSeenDays + "\n" + output;
    /* create export box or remove it if already exists */
    var div = document.querySelector("#pagesection_export");
    if (div == null) {
        div = document.createElement("div");
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
    } else {
        div.remove();
    }
}
if (window.location.href.includes("boardgamearena.com")
    && window.location.href.includes("player")
    || confirm("It seems, you are not on a BGA player profile page.\nWould you still like ot run the script?"))
    {
        try {
            exportStats();
        }
        catch(error) {
            alert("An error occurred. Try reloading the player profile (click on player name) and rerun the script.\n"+error);
        }
    }
};void(0);