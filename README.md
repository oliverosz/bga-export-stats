# BGA statistic bookmarklets

These scripts were created for BGA - [boardgamearena.com](https://boardgamearena.com).
They can be used as [bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet).

## [GameList.js](GameList.js)

This script collects the available games into CSV format.
Use it on the game list page while logged in.
Filtering is not supported currently, the list will include all available games.
Alpha games are only included if you are an alpha reviewer.

## [MoveStats.js](MoveStats.js)

This script creates a CSV formatted table from a game log.
Use it on a game review page (boardgamearena.com/gamereview?table=...).
The CSV table appears at the top, rerunning the script removes it.

## [PlayerStats.js](PlayerStats.js)

This script collects the game stats of players into CSV format.
Use it on the profile page of the player, or a group page to collect stats from all members.
The CSV table appears at the top of the page.

The following values are exported for each game:

- Player Name
- Game Name
- ELO
- Rank
- Matches
- Wins

The first 2 records contain overall player stats:

- Player stats
  - XP (formerly called Prestige)
  - Reputation (Karma ☯)
  - Total matches
  - Total wins
- Recent game history (last 60 days)
  - Abandoned matches
  - Timeouts
  - Total recent matches
  - Days since last online

## [TournamentStats.js](TournamentStats.js)

This script can be used on tournament pages (boardgamearena.com/tournament?id=...) to collect match timeout information.
Player timeouts and remaining times can be displayed for the current tournament, or exported as CSV for the given list of tournaments.
