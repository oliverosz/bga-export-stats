These scripts were created for BGA - [boardgamearena.com](https://boardgamearena.com). They can be used as [bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet).

## [MoveStats.js](MoveStats.js)

This script creates a CSV formatted table from a game log. Use it on a game review page (boardgamearena.com/gamereview?table=...). The CSV table appears at the top, rerunning the script removes it.

## [PlayerStats.js](PlayerStats.js)

This script collects the game stats of a player into CSV format. Use it on the profile page of the player. The CSV table appears at the top, rerunning the script removes it.

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
