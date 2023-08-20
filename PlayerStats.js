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
        output += player + "\t" + game + "\t" + elo + "\t" + rank + "\t" + played + "\t" + won + "\n";
    }
    /* prepend overall player stats */
    output = player + "\tXP\t" + exp + "\t" + karma + "\t" + matches + "\t" + wins + "\n" + 
                player + "\tRecent games\t" + abandoned + "\t" + timeout + "\t" + recent + "\t" + lastSeenDays + "\n" + output;
    return output;
}
/* fetches and prints group members' stats */
function exportPlayerStats() {
    var exported = document.getElementById("export_textarea");
    exported.value = "Loading... ";
    var loading = async () => {
        /* for every player parse stats and concatenate outputs */
        var exported_str = "";
        const parser = new DOMParser();
        const members = document.getElementById("member_list").value.trim().split("\n");
        for (let i = 0; i < members.length; ++i) {
            var player_id = members[i].split(/[;\t]+/)[1];
            const response = await fetch('https://boardgamearena.com/player?id='+player_id);
            const html_str = await response.text();
            const doc = parser.parseFromString(html_str, "text/html");
            try {
                exported_str = exported_str + parsePlayerStats(doc);
            } catch (err) {
                console.log(members[i] + "\n" + err);
                console.log(doc);
                window.alert(members[i] + "\n" + err);
            }
            exported.value = "Loading... " + (i+1) + "/" + members.length;
        }
        exported.value = exported_str.trim();
    };
    loading();
}
/* checks players' membership status in given group ID */
function checkMembership() {
    var group_id = document.getElementById("group_filter").value.trim();
    if (group_id == "") return;
    const players = document.getElementById("member_list").value.trim().split("\n");
    var checkedCount = 0;
    var loading = async () => {
        var checked = "";
        const response = await fetch('https://boardgamearena.com/group?id='+group_id);
        const html_str = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html_str, "text/html");
        const memberlist = doc.querySelectorAll(".list_of_players .player_in_list a.playername");
        var members = new Set();
        memberlist.forEach(member => members.add(member.innerText));
        var unconfirmed = new Set();
        players.forEach(player => {
            const name = player.split(/[;\t]+/)[0];
            if (members.has(name)) {
                checked += player + "\t1\n";
                checkedCount++;
                document.getElementById("member_list").value = "Loading... " + checkedCount + "/" + players.length;
            } else {
                unconfirmed.add(player);
            }
        });
        for (const player of unconfirmed) {
            const player_id = player.split(/[;\t]+/)[1];
            const response = await fetch('https://boardgamearena.com/player?id='+player_id);
            const html_str = await response.text();
            const doc = parser.parseFromString(html_str, "text/html");
            var groups = new Set();
            doc.querySelectorAll("#playergroups .bga-link").forEach(group =>
                groups.add(group.getAttribute("href").match(/id=(\d+)/)[1])
            );
            if (groups.has(group_id)) {
                checked += player + "\t1\n";
            } else {
                checked += player + "\t0\n";
            }
            checkedCount++;
            document.getElementById("member_list").value = "Loading... " + checkedCount + "/" + players.length;
        }
        document.getElementById("member_list").value = checked.trim();
    };
    loading();
}
function displayExportSection() {
    var rootdiv = document.createElement("div");
    rootdiv.className = "pageheader";
    
    const divStyle = "float: left; margin: 0 10px;";
    var membersdiv = document.createElement("div");
    membersdiv.setAttribute("style", divStyle);
    var exportdiv = document.createElement("div");
    exportdiv.setAttribute("style", divStyle);
    rootdiv.appendChild(membersdiv);
    rootdiv.appendChild(exportdiv);

    var membersheader = document.createElement("h3");
    membersheader.innerText = "Name\tPlayer ID";
    membersheader.setAttribute("style", "text-transform: none;");

    var memberlist = document.createElement("textarea");
    memberlist.setAttribute("id", "member_list");
    memberlist.setAttribute("cols", "50");
    memberlist.setAttribute("rows", "10");
    memberlist.setAttribute("style", "display: block;");
    if (m[1] == "player") {
        memberlist.value = document.getElementById("player_name").innerText.trim() + "\t" + m[2];
    }
    else {
        const members = document.querySelectorAll(".list_of_players .player_in_list a.playername");
        members.forEach(member => {
            var player_id = member.getAttribute("href").replace("/player?id=", "");
            memberlist.value = memberlist.value + member.innerText.trim() + "\t" + player_id + "\n";
        });
    }
    membersdiv.appendChild(membersheader);
    membersdiv.appendChild(memberlist);

    var groupFilterText = document.createElement("p");
    groupFilterText.innerText = "Check group membership:";
    membersdiv.appendChild(groupFilterText);

    var groupFilter = document.createElement("input");
    groupFilter.setAttribute("id", "group_filter");
    groupFilter.setAttribute("type", "text");
    groupFilter.setAttribute("style", "width: 180px;");
    if (m[1] == "group") {
        groupFilter.value = m[2];
    } else {
        groupFilter.setAttribute("placeholder", "Enter Group ID");
    }
    membersdiv.appendChild(groupFilter);

    var groupFilterBtn = document.createElement("button");
    groupFilterBtn.setAttribute("type", "button");
    groupFilterBtn.setAttribute("id", "group_filter_btn");
    groupFilterBtn.setAttribute("class", "bgabutton bgabutton_blue");
    groupFilterBtn.setAttribute("onclick", "checkMembership()");
    groupFilterBtn.setAttribute("style", "width: auto; margin: 0px 10px 10px 10px;");
    groupFilterBtn.innerText = "Check";
    membersdiv.appendChild(groupFilterBtn);

    var exportheader = document.createElement("h3");
    exportheader.innerText = "Player Name\tGame Name\tELO\tRank\tMatches\tWins";
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
    startBtn.setAttribute("onclick", "exportPlayerStats()");
    startBtn.setAttribute("style", "width: auto; margin: 10px 0;");
    startBtn.innerText = "Start";

    exportdiv.appendChild(exportheader);
    exportdiv.appendChild(output);
    exportdiv.appendChild(startBtn);
    document.querySelector("#pageheader").parentNode.prepend(rootdiv);
}
m = window.location.href.match(".*boardgamearena.com/(group|player)\\?id=(\\d+)");
if (m || confirm("It seems, you are not on a BGA group or player page.\nWould you still like to run the script?")) {
    try {
        displayExportSection();
    }
    catch(error) {
        alert("An error occurred:\n"+error);
    }
}
};void(0);