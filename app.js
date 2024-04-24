const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const databasePath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())
let database = null

const intializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log('DB Error:${error.message}')
    process.exit(1)
  }
}
intializeDbAndServer()

const convertPlayerDetailDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
const convertMatchDetailDbObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
const convertPlayerScoreDbObjectToResponseObject = dbObject => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
 SELECT
 *
FROM 
 player_details;`
  const playersArray = await database.all(getPlayersQuery)
  response.send(
    playersArray.map(eachplayer =>
      convertPlayerDetailDbObjectToResponseObject(eachplayer),
    ),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerIdQuery = `SELECT
  * from
player_details
where player_id=${playerId}`
  const playerArray = await database.get(getPlayerIdQuery)
  response.send(convertPlayerDetailDbObjectToResponseObject(playerArray))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `
  update 
  player_details
  set
   player_name="${playerName}"
  where
   player_id=${playerId};`
  await database.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `SELECT
  *
  FROM 
  match_details
  where match_id=${matchId};`
  const matchdetail = await database.get(getMatchQuery)
  response.send(convertMatchDetailDbObjectToResponseObject(matchdetail))
})

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const playerMatchQuery = `
  SELECT
  * 
  from
  player_match_score
  NATURAL JOIN match_details
  where 
  player_id=${playerId};
  `
  const output = await database.all(playerMatchQuery)
  response.send(
    output.map(eachplayer =>
      convertMatchDetailDbObjectToResponseObject(eachplayer),
    ),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`
  const playersArray = await database.all(getMatchPlayersQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerDetailDbObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getmatchPlayersQuery = `
    SELECT  
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`
  const playersMatchDetails = await database.get(getmatchPlayersQuery)
  response.send(playersMatchDetails)
})

module.exports = app
