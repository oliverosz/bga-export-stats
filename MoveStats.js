javascript:{
    function JSDateToExcelDate(inDate) {
        /* Source: https://www.flyaga.info/converting-a-javascript-date-object-to-an-excel-date-time-serial-value/ */
        var returnDateTime = 25569.0 + ((inDate.getTime() - (inDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24));
        return returnDateTime.toString().substr(0,20).replace(".", ",");
    }
    /* generates CSV from timestamps of player moves in a match */
    function exportStats() {
        var output = "";
        var gameName;
        var tableID;
        try {
            var titleStr = document.querySelector("#reviewtitle").innerText.match(/(\w+) (.+) #(\d+)/);
            gameName = titleStr[2];
            tableID = titleStr[3];
        } catch (error) {
            console.log("Error while parsing log title.");
        }
        var players = Array.from(document.querySelectorAll("#game_result .name")).map(item => item.innerText);
        var moveNo;
        var date;
        var time;
        var player;
        var remaining;
        var logs = document.querySelector("#gamelogs").children;
        for (var i = 0; i < logs.length; i++) {
            var toPrint = false;
            try {
                if (logs[i].className == "smalltext") {
                    moveNo = logs[i].innerText.match(/\w+ (\d+) ?:/)[1];
                    var timeParts = logs[i].getElementsByTagName("span")[0].innerText.match(/(\d+\/\d+\/\d+ )?(\d+:\d+:\d+ [AP]M)/);
                    time = timeParts[2];
                    if (timeParts[1] != undefined) {
                        date = timeParts[1];
                    }
                    player = undefined;
                }
                else if (player == undefined) {
                    if (logs[i].className.includes("gamelogreview")) {
                        var words = logs[i].innerText.split(" ");
                        player = words.find(word => players.includes(word));
                    }
                } else if (logs[i].className.includes("reflexiontimes_block")) {
                    for (var j = 0; j < logs[i].childElementCount; j++) {
                        if (logs[i].children[j].innerText.indexOf(player) == 0) {
                            remaining = logs[i].children[j].children[0].innerText;
                            toPrint = true;
                            break;
                        }
                    }
                }
            } catch (error) {
                console.log(error);
                console.log("Could not parse element: " + logs[i].toString());
            }
            if (toPrint) {
                output = output + [tableID, gameName, moveNo, JSDateToExcelDate(new Date(date + time)), player, remaining].join(";") + "\n";
                moveNo = undefined;
                time = undefined;
                remaining = undefined;
            }
        }
        /* create export box or remove it if already exists */
        var div = document.querySelector("#pagesection_export");
        if (div == null) {
            div = document.createElement("div");
            div.setAttribute("id", "pagesection_export");
            div.className = "pagesection";
            var header = document.createElement("h3");
            header.innerText = "Table ID;Game Name;Move No.;Date Time;Player Name;Remaining Time"; /* column headers in the box title */
            var exported = document.createElement("div");
            /* select all text when clicked */
            exported.setAttribute("style", "-webkit-touch-callout: all; -webkit-user-select: all; -khtml-user-select: all; -moz-user-select: all; -ms-user-select: all; user-select: all;");
            exported.innerText = output;
            div.appendChild(header);
            div.appendChild(exported);
            document.querySelector(".pageheader").parentNode.prepend(div);
        } else {
            div.remove();
        }
    }
    if (window.location.href.includes("boardgamearena.com")
        && window.location.href.includes("gamereview")
        || confirm("It seems, you are not on a BGA match review page.\nWould you still like to run the script?"))
        {
            try {
                exportStats();
            }
            catch(error) {
                alert("An error occurred. Try reloading the page and rerun the script.\n"+error);
            }
        }
    };void(0);