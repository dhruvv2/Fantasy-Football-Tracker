var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql2');
var path = require('path');
var connection = mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: 'Kashish2001',
                database: 'roosters_fantasy'
});

connection.connect;


var app = express();
var userID = 1;


// set up ejs view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '../public'));

/* GET home page, respond by rendering index.ejs */
app.get('/watchlist', function(req, res) {
    sql = 'SELECT * FROM Watchlist WHERE UserID = ' + userID + ';';
    sql3 = 'SELECT * FROM SuggestionsTable WHERE Player_Name NOT IN (SELECT Name FROM Watchlist WHERE UserID = 1) ORDER BY Avg_Fantasy_Points DESC LIMIT 10;';
    connection.query(sql, function(err, result) {
        if (err) {
            res.send(err)
            return;
        }

        sql2 = 'CALL P;';
        
        connection.query(sql2, function(err, result1_) {
            if (err) {
                res.send(err)
                return;
            }

            connection.query(sql3, function(err, result1) {
                if (err) {
                    res.send(err)
                    return;
                }
                
                res.render('watchlist', { title: 'Mark Attendance', userData: result, recsData: result1 });
            });
        });
    });
});


app.get('/watchlist/player/edit/:playerID', function(req, res) {
    var playerName = req.params.playerID;

    sql = 'SELECT * FROM Watchlist WHERE UserID = ' + userID + ' AND Name = "' + playerName + '";'
    connection.query(sql, function(err, result) {
        if (err) {
            res.send(err)
            return;
        }
        // console.log(result);
        res.render('playeredit', {userData: result[0]});
    });
});


app.post('/watchlist/player/edit/mark/:playerID', function(req, res) {
    var playerName = req.params.playerID;
    var notes = req.body.notes;

    sql = 'UPDATE Watchlist SET Notes = "' + notes +  '" WHERE Name = "' + playerName + '" AND UserID = "' + userID + '";'
    connection.query(sql, function(err, result) {
        if (err) {
            res.send(err)
            return;
        }
        res.redirect('/watchlist');
    });
});


app.get('/watchlist/player/delete/:playerID', function(req, res) {
    var playerName = req.params.playerID;

    var sql = 'DELETE FROM Watchlist WHERE Name = "' + playerName + '";';
    connection.query(sql, function(err, result) {
        if (err) {
        res.send(err)
        return;
        }
        res.redirect('/watchlist');
    });
});

app.get('/watchlist/search', function(req, res) {
    var searchKey = req.query.player_name;
    // console.log(searchKey);
    
    if (searchKey.length == 0) {
        res.redirect('/watchlist');
    }
    else {
        var sql = 'SELECT * FROM Players WHERE Player_Name LIKE "' + searchKey + '%";';
        connection.query(sql, function(err, result) {
            if (err) {
            res.send(err)
            return;
            }
            // console.log(result);
            res.render('search', {userData: result, searchKey: searchKey});
        });
    }
});

app.get('/watchlist/search/:searchKey', function(req, res) {
    var searchKey = req.params.searchKey;
    // console.log(searchKey);
    // console.log(searchKey, searchKey.length);
    if (searchKey.length == 0) {
        res.redirect('/watchlist');
    }
    else {
        data = [{playerID: 1, playerName: 'player 1', notes: 'note 1'}, 
            {playerID: 2, playerName: 'player 2', notes: 'note 2'}]

        res.render('search', {userData: data, searchKey: searchKey});
    }
});

app.get('/watchlist/player/add/:playerID', function(req, res) {
    var playerName = req.params.playerID;
    // console.log(playerName);

    var sql1 = 'SELECT MAX(WatchlistID) FROM Watchlist';
    connection.query(sql1, function(err, result) {
        if (err) {
        res.send(err)
        return;
        }
        id = result[0]['MAX(WatchlistID)'] + 1;
        // console.log(id);
        var sql = 'INSERT INTO Watchlist (WatchlistID, UserID, Name, Notes) VALUES (' + id + ', ' + userID + ', "' + playerName + '", "");';
        // console.log(sql);
        // console.log(playerName);

        connection.query(sql, function(err, result) {
            if (err) {
            res.send(err)
            return;
            }
            res.redirect('/watchlist');
        });
    });
});


app.get('/ppt', function(req, res) {
    // SQL Stuff

    // var sql = 'DELETE FROM Watchlist WHERE UserID = ' + playerID + ';';
    var sql = "SELECT ROUND(Total_Fantasy_Points / Total_Players, 2) AS Average_Fantasy_Points, P.Team FROM (SELECT SUM(Avg_Fantasy_Points) AS Total_Fantasy_Points, Team FROM Players GROUP BY Team) AS T JOIN (SELECT COUNT(PlayerID) AS Total_Players, Team FROM Players GROUP BY Team) AS P ON (P.Team = T.Team) ORDER BY Average_Fantasy_Points DESC LIMIT 15;";
    connection.query(sql, function(err, result) {
        if (err) {
        res.send(err)
        return;
        }
        res.render('pointsperteam', {userData: result});
    });

});


app.get('/comp', function(req, res) {
    var first_division = req.query.first_division;
    var second_division = req.query.second_division;

    data = []
    if (first_division != null && second_division != null) {
        // SQL Stuff

        var sql = "(SELECT p.Player_Name, t.Team, t.Division, p.Avg_Fantasy_Points FROM Players p JOIN Teams t ON(p.Team = t.Team) WHERE t.Division Like('" + first_division + "') AND p.Avg_Fantasy_Points > 13 LIMIT 7) UNION (SELECT p.Player_Name, t.Team, t.Division, p.Avg_Fantasy_Points FROM Players p JOIN Teams t ON(p.Team = t.Team) WHERE t.Division Like ('" + second_division + "') and p.Avg_Fantasy_Points > 13 LIMIT 8) ORDER BY Avg_Fantasy_Points DESC;";
        // console.log(sql);
        
        connection.query(sql, function(err, result) {
            if (err) {
            res.send(err)
            return;
            }

            // console.log(result);
            res.render('comp', {userData: result});
        });
    }
    else {
        res.render('comp', {userData: []});
    }
});


app.listen(80, function () {
    console.log('Node app is running on port 80');
});


/*
Trigger for Update:

delimiter |
CREATE TRIGGER UpdateWatchlistTrigger
    BEFORE UPDATE ON Watchlist
    FOR EACH ROW
    BEGIN
        IF TRIM(new.Notes) = "" THEN
            SET new.Notes = "N/A";
        END IF;
    END;
|
delimiter ;



Trigger for Insert:

delimiter |
CREATE TRIGGER trig
    BEFORE INSERT ON Watchlist
    FOR EACH ROW
    BEGIN
        IF new.Notes = "" THEN
            SET new.Notes = "N/A";
        END IF;
    END;
|
delimiter ;


Stored Procedure:

DELIMITER //
    CREATE PROCEDURE P() 
    BEGIN 
        DECLARE finished int default 0;
        DECLARE name VARCHAR(50); 

        DECLARE cur CURSOR FOR 
            ((SELECT Player_Name
            FROM 
            Players
            WHERE Players.Team IN (SELECT TEAM FROM
            Players
            JOIN
            (SELECT * FROM Watchlist WHERE UserID = 1) AS E
            ON Players.Player_Name = E.Name)
            EXCEPT
            SELECT Player_Name
            FROM
            Players
            WHERE Players.Player_Name IN (SELECT Name FROM Watchlist WHERE UserID = 1)
            ));
        

        DECLARE CONTINUE HANDLER FOR NOT FOUND SET FINISHED = 1; 
        DROP TABLE IF EXISTS SuggestionsTable; 
        CREATE TABLE SuggestionsTable (
            PlayerID INT,
            Player_Name VARCHAR(50),
            Team VARCHAR(5),
            Position VARCHAR(50),
            Age INT,
            Avg_Fantasy_Points REAL
            );


        OPEN cur; 
        REPEAT FETCH cur INTO name; 
        
            INSERT INTO SuggestionsTable 
            SELECT * 
            FROM Players
            WHERE Player_Name = name;

        UNTIL finished END REPEAT; 
        close cur; 

        IF NOT EXISTS 
            (SELECT * FROM SuggestionsTable)
        THEN
            INSERT INTO SuggestionsTable 
                (SELECT * FROM
                Players 
                WHERE Players.Team in
                (SELECT Team FROM
                (SELECT A.Team, A.Wins + B.Wins AS Wins
                FROM 
                (SELECT Teams.Team AS Team, COUNT(GameID) AS Wins
                FROM Teams JOIN Games ON Teams.Team = Games.Home_Team
                WHERE Games.Home_Score > Games.Away_Score
                GROUP BY Teams.Team) AS A
                JOIN
                (SELECT Teams.Team AS Team, COUNT(GameID) AS Wins
                FROM Teams JOIN Games ON Teams.Team = Games.Away_Team
                WHERE Games.Home_Score > Games.Away_Score
                GROUP BY Teams.Team) AS B
                ON A.Team = B.Team
                ORDER BY Wins DESC
                LIMIT 1) AS D)
                EXCEPT
                SELECT *
                FROM
                Players
                WHERE Players.Player_Name IN (SELECT Name FROM Watchlist WHERE UserID = 1));

        END IF; 

       
        SELECT * FROM SuggestionsTable WHERE Player_Name NOT IN (SELECT Name FROM Watchlist WHERE UserID = 1) ORDER BY Avg_Fantasy_Points DESC LIMIT 10; 
    END //

    DELIMITER ;

*/