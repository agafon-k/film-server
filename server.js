var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'liferay',
    password: 'liferay'
});

var app = express();

connection.connect(function (err) {
    if (!err) {
        console.log("Connected!");
        connection.query("CREATE DATABASE IF NOT EXISTS Films");
        connection.query("USE Films", function (err) {
            if (err) console.log("Can't use database films");
        });
        connection.query('CREATE TABLE IF NOT EXISTS filmsTable('
            + 'id INT NOT NULL AUTO_INCREMENT,'
            + 'PRIMARY KEY(id),'
            + 'title VARCHAR(255),'
            + 'imdbId VARCHAR(30),'
            + 'releaseCountry VARCHAR(255),'
            + 'releaseYear VARCHAR(4),'
            + 'rating VARCHAR(2),'
            + 'comment LONGTEXT,'
            + 'byOrder NUMERIC'
            + ')', function (err) {
            if (err) console.log(err);
        });
    } else {
        console.log("Error connecting database ... \n\n");
    }
});

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.json());

app.get('/', function (req, res) {
    connection.query('SELECT * FROM filmsTable ORDER BY byOrder', function (err, result) {
        if (err) {
            throw err;
        } else {
            res.send(result);
        }
    });
});

app.put('/', function (req, res) {
    console.log(req.body);
    var sql;
    var id = req.body.id;
    var newPosition = req.body.newPosition;
    var oldPosition = req.body.oldPosition;

    if (oldPosition === newPosition) {
        return;
    } else if (newPosition > oldPosition) {
        sql = 'UPDATE filmsTable SET byOrder = (CASE WHEN id = '+ id + ' then ' + newPosition + ' WHEN byOrder <= ' + newPosition + ' AND byOrder > ' + oldPosition + ' AND id <> ' + id + ' then byOrder - 1  ELSE byOrder end)';
    } else {
        sql = 'UPDATE filmsTable SET byOrder = (CASE WHEN id = '+ id + ' then ' + newPosition + ' WHEN byOrder >= ' + newPosition + ' AND byOrder < ' + oldPosition + ' AND id <> ' + id + ' then byOrder + 1 ELSE byOrder end)';
    }

    connection.query(sql, function (err, result) {
        if (err) console.log(err);
        res.send(result);
    });
});

app.get('/film/:id', function (req, res) {

    var sql = "SELECT * FROM filmsTable WHERE id='" + req.params.id + "'";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    });
});

app.put('/save/film/:id', function (req, res) {
    var id = req.params.id;
    var data = {
        title: req.body.title,
        imdbId: req.body.imdbId,
        releaseCountry: req.body.releaseCountry,
        releaseYear: req.body.releaseYear,
        rating: req.body.rating,
        comment: req.body.comment
    };

    console.log(data);
    var sql = ('UPDATE filmsTable SET ? WHERE id = ?');

    connection.query(sql, [data, id], function (err, result) {
        if (err) throw err;
        console.log("1 record updated");
    });
});


app.post('/save', function (req, res, next) {

    console.log('SAVED');
    console.log(req.body);
    var data = {
        title: req.body.title,
        imdbId: req.body.imdbId,
        releaseCountry: req.body.releaseCountry,
        releaseYear: req.body.releaseYear,
        rating: req.body.rating,
        comment: req.body.comment
    };
    var sql = "INSERT INTO filmsTable ( title, imdbId, releaseCountry, releaseYear, rating, comment, byOrder) " +
        "SELECT '" + data.title + "', '" + data.imdbId + "', '" +
        req.body.releaseCountry + "', '" + req.body.releaseYear + "', '" + req.body.rating + "', '" +
        req.body.comment + "', MAX(byOrder) + 1 from filmsTable";
    connection.query(sql, function (err, result) {
        console.log(sql);
        if (err) throw err;
        console.log("1 record inserted");
    });
    next();
});

app.delete('/film/:id', function (req, res, next) {
    console.log("CALLED");
    console.log(req.params.id);

    var id = req.params.id;
    var sql = ('DELETE FROM filmsTable WHERE id=' + id);
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record was deleted");
    });
    next();
});


app.listen(3000);