javascript:{
/* generates CSV from user data */
function parsePlayerStats(player_page) {
    var output = "";
    var player = player_page.querySelector("#player_name").innerText.trim();
    /* overall stats */
    var exp = player_page.querySelector("#pageheader_prestige").innerText.trim().replace('k','000').replace(' XP','');
    var karma = player_page.querySelector(".progressbar_label").getElementsByClassName("value")[0].innerText.replace('%','');
    var matches = 0;
    var wins = 0;
    var penalties = player_page.querySelector("#pagesection_reputation").getElementsByClassName("row-value")[0].innerText.match(/(\d+)/g);
    var abandoned = penalties[0];
    var timeout = penalties[1];
    var recent = penalties[2];
    /* days since last online */
    var lastSeenStr = player_page.querySelector("#last_seen").innerText;
    var lastSeenDays = 0;
    var lastSeenMatch = lastSeenStr.match(/(\d+|NaN)?\s*(.*)/);
    if (lastSeenStr == "" || lastSeenStr == "{LAST_SEEN}" || lastSeenMatch[1] == "NaN")
        lastSeenDays = 0;
    else if (lastSeenMatch[1] !== undefined)
        lastSeenDays = Number(lastSeenMatch[1]);
    else
        lastSeenDays = 1;
    if (lastSeenDays == 0) {
        lastSeenDays = 0
    } else if (String(lastSeenMatch[2]).search("év|year") != -1) {
        lastSeenDays *= 365;
    } else if (String(lastSeenMatch[2]).search("hónap|month") != -1) {
        lastSeenDays *= 30;
    } else if (String(lastSeenMatch[2]).search("(mn|h|seconds|perc|óra|néhány pillanattal) (ezelőtt|ago)") != -1) {
        lastSeenDays = 0;
    }
    /* stats per game */
    var gameDivs = player_page.querySelector("#pagesection_prestige").getElementsByClassName("row")[0].getElementsByClassName("palmares_game");
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
    output = player + ";XP;" + exp + ";" + karma + ";" + matches + ";" + wins + "\n" + 
                player + ";Recent games;" + abandoned + ";" + timeout + ";" + recent + ";" + lastSeenDays + "\n" + output;
    return output;
}
/* copies the CSV to clipboard */
function copy() {
    var copyText = document.getElementById("export_textarea");
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */
    navigator.clipboard.writeText(copyText.value);
    copyBtn = document.getElementById("copyBtn");
    copyBtn.innerText = "Copied!";
}
function displayExportSection() {
    var div = document.createElement("div");
    div.setAttribute("id", "pagesection_export");
    div.className = "pagesection";
    var header = document.createElement("h3");
    header.innerText = "Player Name;Game Name;ELO;Rank;Matches;Wins"; /* column headers in the box title */
    header.setAttribute("style", "text-transform: none;");
    var exported = document.createElement("textarea");
    exported.setAttribute("id", "export_textarea");
    exported.setAttribute("cols", "100");
    exported.setAttribute("rows", "10");
    exported.setAttribute("style", "display: block;");
    exported.value = "Loading...";
    var copyBtn = document.createElement("button");
    copyBtn.setAttribute("type", "button");
    copyBtn.setAttribute("id", "copyBtn");
    copyBtn.setAttribute("onclick", "copy()");
    copyBtn.setAttribute("style", "width: auto; padding: 3px; margin-top: 15px; border: 1px solid black;");
    copyBtn.innerText = "Copy to clipboard";
    div.appendChild(header);
    div.appendChild(exported);
    div.appendChild(copyBtn);
    document.querySelector("#pageheader").parentNode.prepend(div);
}
/* fetches and prints group members' stats */
async function exportPlayerStats() {
    /* for every group member parse player stats and concatenate outputs */
    exported_str = "";
    var exported = document.getElementById("export_textarea");
    members = document.querySelectorAll(".list_of_players .player_in_list a.playername");
    for (let i = 0; i < members.length; ++i) {
        var player_id = members[i].getAttribute("href").replace("/player?id=", "");
        const response = await fetch('https://boardgamearena.com/player?id='+player_id);
        const html_str = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html_str, "text/html");
        exported_str = exported_str + parsePlayerStats(doc);
        exported.value = "Loading... " + (i+1) + "/" + members.length;
    }
    exported.value = exported_str;
}
m = window.location.href.match(".*boardgamearena.com/(group|player)\\?id=");
if (m || confirm("It seems, you are not on a BGA group or player page.\nWould you still like to run the script?")) {
    try {
        displayExportSection();
        if (m[1] == "player") {
            var exported = document.getElementById("export_textarea");
            exported.value = parsePlayerStats(document);
        } else {
            exportPlayerStats();
        }
    }
    catch(error) {
        alert("An error occurred:\n"+error);
    }
}
};void(0);