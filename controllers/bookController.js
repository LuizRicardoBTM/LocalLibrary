const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const {body, validationResult} = require("express-validator");
const { title } = require("process");
const author = require("../models/author");

exports.index = async (req, res, next) => {
  
  const [
    number_of_books,
    number_of_book_instances,
    number_of_available_book_instances,
    number_of_authors,
    number_of_genres,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: "Available" }).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
  ]);

  res.render("index", {
    title: "Local Library Home",
    number_of_books,
    number_of_book_instances,
    number_of_available_book_instances,
    number_of_authors,
    number_of_genres,
  });
};

exports.bookList = async (req, res, next) => {
  const books_list = await Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author")
    .exec();

  res.render("bookList", { 
    title: "Book List", 
    books_list,
  });
};

exports.bookDetail = async (req, res, next) => {

  const [book, book_instances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({book: req.params.id}).exec(),
  ]);
  
  if(book === null){
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookDetail", {
    title: book.title,
    book,
    book_instances,
  })
};

exports.bookCreateGet = async (req, res, next) => {
  const [allAuthors, allGenres] = await Promise.all([
    
    Author.find().sort({surname: 1}).exec(),
    Genre.find().sort({name: 1}).exec(),
  ])

  res.render("bookForm", {
    title: "Create Book",
    allAuthors,
    allGenres,
  })
    
};

exports.bookCreatePost = [
  (req, res, next) => {
    if(!Array.isArray(req.body.genre)){
      req.body.name = typeof req.body.name === "undefined" ? [] : [req.body.genre];
    }

    next();
  },

  body("title", "Title must not be empty.")
    .trim()
    .isLength({min: 1})
    .escape(),

  body("author", "Author must not be empty.")
    .trim()
    .isLength({min: 1})
    .escape(),

  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({min: 1})
    .escape(),

  body("isbn", "ISBN must not be empty.")
    .trim()
    .isLength({min: 1})
    .escape(),

  body("genre.*")
    .escape(),

  async (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if(!errors.isEmpty()){

      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({surname: 1}).exec(),
        Genre.find().sort({name: 1}).exec(),
      ]);

      for(const genre of allGenres){
        if(book.genre.includes(genre._id)){
          genre.checked = "true";
        }
      }

      res.render("bookForm", {
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
        book,
        errors: error.Array(),
      })

      return;
    }

    await book.save();
    res.redirect(book.url)
  }
];

exports.bookDeleteGet = async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Book delete get");
};

exports.bookDeletePost = async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Book delete post");
};

exports.bookUpdateGet = async (req, res, next) => {
  const [book, all_authors, all_genres] = await Promise.all([
    Book.findById(req.params.id).populate("author").exec(),
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);

  if (book === null) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  all_genres.forEach((genre) => {
    if (book.genre.includes(genre._id)) genre.checked = "true";
  });

  res.render("bookForm", {
    title: "Update Book",
    authors: all_authors,
    genres: all_genres,
    book,
  });
};

exports.bookUpdatePost = [
  (req, res, next) => {
    const body = req.body;

    if (!Array.isArray(body.genre)) {
      body.genre =
        typeof body.genre === "undefined" ? [] : [body.genre];
    }
    next();
  },

  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("isbn", "ISBN must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("genre.*")
    .escape(),

  async (req, res, next) => {
    const errors = validationResult(req);
    const body = req.body;
    const params = req.params;

    const book = new Book({
      title: body.title,
      author: body.author,
      summary: body.summary,
      isbn: body.isbn,
      genre: typeof body.genre === "undefined" ? [] : body.genre,
      _id: params.id,
    });

    if (!errors.isEmpty()) {
      const [all_authors, all_genres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      for (const genre of all_genres) {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      }
      res.render("bookForm", {
        title: "Update Book",
        authors: all_authors,
        genres: all_genres,
        book,
        errors: errors.array(),
      });
      return;
    }

    const updatedBook = await Book.findByIdAndUpdate(params.id, book, {});
    res.redirect(updatedBook.url);
  },
];