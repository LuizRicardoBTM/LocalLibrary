const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

exports.bookInstanceList = async (req, res, next) => {
  const book_instances_list = await BookInstance.find().populate("book").exec();

  res.render("bookinstanceList", {
    title: "Book Instance List",
    book_instances_list,
  });
};

exports.bookInstanceDetail = async (req, res, next) =>{

    const book_instance = await BookInstance
    .findById(req.params.id)
    .populate("book")
    .exec();

    if(book_instance === null){
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstanceDetail", {
        title: "Book: ",
        book_instance,
    })
};

exports.bookInstanceCreateGet = async (req, res, next) => {
    const all_books = await Book.find({}, "title").sort({title: 1}).exec();

    res.render("bookInstanceForm", {
        title: "Create Book Instance",
        bookList: all_books,
    });
};

exports.bookInstanceCreatePost = [
  body("book", "Book must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("status")
    .escape(),

  body("dueBack", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),


  async (req, res, next) => {
    const errors = validationResult(req);
    const body = req.body;

    if (!errors.isEmpty()) {
      const all_books = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookInstanceForm", {
        title: "Create Book Instance",
        bookList: all_books,
        selectedBook: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    }

    const bookInstance = new BookInstance({
      book: body.book,
      imprint: body.imprint,
      status: body.status,
      dueBack: body.due_back,
    });
    await bookInstance.save();

    res.redirect(bookInstance.url);
  },
];

exports.bookInstanceDeleteGet = async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance delete get");
};

exports.bookInstanceDeletePost = async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance delete post");
};

exports.bookInstanceUpdateGet = async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance update get");
};

exports.bookInstanceUpdatePost = async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance update post");
};