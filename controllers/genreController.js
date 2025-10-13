const utils = require("../utils");
const Genre = require("../models/genre");
const Book = require("../models/book");
const {body, validationResult} = require("express-validator");

exports.genreList = async (req, res, next) => {
    const genres_list = await Genre.find().sort({ name: 1 }).exec();

    res.render("genreList", {
      title: "Genre List",
      genres_list,
    });
};

exports.genreDetail = async (req, res, next) => {

  const [genre, books_in_genre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (genre === null) {
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genreDetail", {
    title: "Genre Detail",
    genre,
    books_in_genre,
  });
};

exports.genreCreateGet = (req, res, next) => {
    res.render("genreForm", {title: "Create Genre"});
};

exports.genreCreatePost = [
  body("name"),

    async (req, res, next) => {
      const payload = req.body;

      const errors = validationResult(req);

      if(!errors.isEmpty()){
        res.render("genreForm", {
          title: "Create Genre",
          genre,
          errors: errors.array(),
        });

        return;
      }
      const cleanGenre = utils.genreValidation(payload.name, 3);

      const genreExists = await Genre.findOne({name: cleanGenre})
        .collation({locale: "en", strength: 2})
        .exec();

      if(genreExists){
        res.redirect(genreExists.url);
        return;
      }

      const genre = new Genre({name: cleanGenre});
      await genre.save();
      
      res.redirect(genre.url);
    }
]

exports.genreDeleteGet = async (req, res, next) => {
  const params = req.params;
  const [genre, all_genre_books] = await Promise.all([
      Genre.findById(params.id).exec(),
      Book.find({ genre: params.id }, "title summary").exec(),
  ]);

  if (genre === null) {
    res.redirect("/catalog/genres");
    return;
  }

  res.render("genreDelete", {
    title: "Delete Genre",
    genre,
    genreBooks: all_genre_books,
  });
};

exports.genreDeletePost = async (req, res, next) => {
    const params = req.params;
    const body = req.body;
    const [genre, all_genre_books] = await Promise.all([
        Genre.findById(params.id).exec(),
        Book.find({ genre: params.id }, "title summary").exec(),
    ]);

    if (all_genre_books.length > 0) {
        res.render("genreDelete", {
            title: "Delete Genre",
            genre,
            genreBooks: all_genre_books,
        });
        return;
    }
    
    await Genre.findByIdAndDelete(body.genreid);
    res.redirect("/catalog/genres");
};

exports.genreUpdateGet = async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Genre update get");
};

exports.genreUpdatePost = async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Genre update post");
};