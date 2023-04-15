"use strict";

const fs = require('fs');
const Sqlite = require('better-sqlite3');

let db = new Sqlite('./db.sqlite');

db.exec("DROP TABLE IF EXISTS movies;");
db.prepare("create table movies(id integer primary key autoincrement, title text not null," + 
            " year integer not null, actors text not null, plot text not null, poster text);").run();

exports.load = function(filename) {
  const movies = JSON.parse(fs.readFileSync(filename));
  let insert = db.prepare('INSERT INTO movies VALUES ' +
                          '(@id, @title, @year,' +
                          ' @actors, @plot, @poster)');
  let clear_and_insert_many = db.transaction((movies) => {
    db.prepare('DELETE FROM movies');
    for (let id of Object.keys(movies)) {
      insert.run(movies[id]);
    }
  });
  clear_and_insert_many(movies);
  return true;
};

exports.save = function(filename) {
  let movie_list = db.prepare('SELECT * FROM movies ORDER BY id').all();
  let movies = {};
  for (let movie of movie_list) {
    movies[movie.id] = movie;
  }
  fs.writeFileSync(filename, JSON.stringify(movies));
};

exports.list = function() {
  return db.prepare("SELECT * FROM movies ORDER BY id").all();
};

exports.create = function(title, year, actors, plot, poster) {
  const insert = db.prepare('INSERT INTO movies (title, year, actors, plot, poster) VALUES (?, ?, ?, ?, ?)');
  return insert.run(title, year, actors, plot, poster).lastInsertRowid;;
};

exports.read = function(id) {
  const movie = db.prepare("SELECT * FROM movies WHERE id = ?").get(id);
  if(movie) return movie;
  return null;
};

exports.update = function(id, title, year, actors, plot, poster) {
  let res = db.prepare('UPDATE movies SET title = ?, year = ?, actors = ?, plot = ?, poster = ? WHERE id = ?');
  let updated = res.run(title, year, actors, plot, poster, id);
  return updated.changes == 1;
};

exports.delete = function(id) {
  let toDelete = db.prepare('DELETE FROM movies WHERE id = ?').run(id);
  return toDelete.changes == 1;
};