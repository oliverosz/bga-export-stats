javascript:{
function loadGames() {
    var rows = [];
    var loading = async () => {
        var game_list = document.querySelector("#game_list");
        game_list.value = "Loading...";
        const response = await fetch('https://boardgamearena.com/gamelist?allGames=');
        const html_str = await response.text();
        const start = html_str.indexOf('"game_list"') + 12;
        const end = html_str.indexOf('"game_tags"') - 1;
        const arr = JSON.parse(html_str.substring(start, end));
        arr.forEach(function(game) {
            if (game.status == "private") game.status = "alpha";
            const id = game.id;
            const name = game.name;
            const disp_name = game.display_name_en;
            const status = game.status;
            const premium = Number(game.premium);
            rows.push(id+"\t"+name+"\t"+disp_name+"\t"+status+"\t"+premium);
        });
        game_list.value = rows.join("\n");
    };
    loading();
}
function init() {
    var rootdiv = document.createElement("div");
    rootdiv.className = "px-4 desktop:px-24";
    var title = document.createElement("div");
    title.className = "mb-0 flex items-center";
    title.innerHTML = '<div class="flex-1 flex items-center"><div class="text-3xl font-extrabold text-gray-600 dark:text-gray-300">ID\tName\tDisplay name\tStatus\tPremium</div></div>';
    rootdiv.appendChild(title);

    var games = document.createElement("textarea");
    games.setAttribute("id", "game_list");
    games.setAttribute("cols", "80");
    games.setAttribute("rows", "10");
    rootdiv.appendChild(games);

    var startBtn = document.createElement("button");
    startBtn.setAttribute("id", "startBtn");
    startBtn.setAttribute("type", "button");
    startBtn.setAttribute("id", "startBtn");
    startBtn.setAttribute("class", "bgabutton bgabutton_blue");
    startBtn.setAttribute("onclick", "loadGames()");
    startBtn.setAttribute("style", "width: auto; margin: 10px 0; display: flex");
    startBtn.innerText = "Start";
    rootdiv.appendChild(startBtn);

    document.querySelector(".bga-game-browser__panel").prepend(rootdiv);
}
m = window.location.href.match(".*boardgamearena.com/gamelist");
if (m || confirm("It seems, you are not on a BGA game list page.\nWould you still like to run the script?")) {
    try {
        init();
    }
    catch(error) {
        alert("An error occurred:\n"+error);
    }
}
};void(0);