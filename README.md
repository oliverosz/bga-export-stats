## Description

This bookmarklet was created for BGA - [boardgamearena.com](https://boardgamearena.com). This script collects the game stats of a player into CSV format, with the following values for each game:
- Player Name
- Game Name
- ELO
- Rank
- Matches
- Wins

The first 2 records contain overall player stats:
- Player stats
    - Prestige
    - Reputation (Karma ☯)
    - Total matches
    - Total wins
- Recent game history (last 60 days)
    - Abandoned matches
    - Timeouts
    - Total recent matches
    - Days since last online

## Usage

Create a bookmark in your browser, and copy the contents of the [bga-export-stats.js](bga-export-stats.js) file into the URL filed of the bookmark. When you're on a BGA player profile, open the bookmark, which will run the script and display the results.
