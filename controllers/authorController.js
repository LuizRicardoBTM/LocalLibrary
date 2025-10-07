const { error } = require("node:console");
const Author = require("../models/author");
const Book = require("../models/book");
const {body, validationResult} = require("express-validator");

exports.authorList = async (req, res, next) => {
  const authors_list = await Author.find().sort({ surname: 1 }).exec();
  res.render("authorList", {
    title: "Author List",
    authors_list,
  });
};

exports.authorDetail = async (req, res, next) => {
    const payload = req.params;

    try {
        const author = await Author.findById(payload.id).exec();

    if(author === null){
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }
    const  author_books  = await Book.find({ author: payload.id }, "title summary").exec();

    res.render("authorDetail", {
        title: "Author Details",
        author,
        author_books,
    });

   } catch (error) {
    return next(error); 
   }
};

exports.authorCreateGet = (req, res, next) => {
    res.render("authorForm", {title: "Create Author"})
};

exports.authorCreatePost = [

    body("firstName")
        .trim()
        .isLength({min: 1})
        .escape()
        .withMessage("Name must be specified.")
        .isAlphanumeric()
        .withMessage("Name has non-alphanumeric characters."),

    body("surname")
        .trim()
        .isLength({min: 1})
        .escape()
        .withMessage("Surname must be specified.")
        .isAlphanumeric()
        .withMessage("Surname has non-alphanumeric characters."),

    body("birthDate", "Invalid date of birth")
        .optional({values: "falsy"})
        .isISO8601()
        .toDate(),

    body("deathDate", "Invalid date of death")
        .optional({values: "falsy"})
        .isISO8601()
        .toDate(),


    async (req, res, next) =>{
        const errors = validationResult(req);
        const payload = req.body;

        const author = new Author({
            firstName: payload.firstName,
            surname: payload.surname,
            birthDate: payload.birthDate,
            deathDate: payload.deathDate,
        })

        if(!errors.isEmpty()){
            res.render("authorForm", {
                title: "Create Author",
                author,
                errors: errors.array(),
            });
            return;
        }

        function deathBeforeBirth (birth, death){
            if(birth >= death){
                return true;
            }
            return false;
        }

        if(birthAndDeathDateExists(payload.birthDate, payload.deathDate)){
            
            if(deathBeforeBirth(payload.birthDate.getTime(), payload.deathDate.getTime())){
                return res.render("authorForm", {
                        title: "Create Author",
                        author,
                        errorMensage: "The date of death cant be before or equal to date of birth",
                    });
                
            }
        }   
        
        await author.save();
        res.redirect(author.url);
    }
];

exports.authorDeleteGet = async (req, res, next) => {
    const payload = req.params;
    const [author, all_author_books] = await Promise.all([
        Author.findById(payload.id).exec(),
        Book.find({ author: payload.id }, "title summary").exec(),
    ]);

  if (author === null) {
    res.redirect("/catalog/authors");
    return;
  }

  res.render("authorDelete", {
    title: "Delete Author",
    author,
    authorBooks: all_author_books,
  });
};

exports.authorDeletePost = async (req, res, next) => {
    const payload = req.params;
    const [author, all_author_books] = await Promise.all([
        Author.findById(payload.id).exec(),
        Book.find({ author: payload.id }, "title summary").exec(),
    ]);

    if (all_author_books.length > 0) {
        res.render("authorDelete", {
            title: "Delete Author",
            author,
            authorBooks: all_author_books,
        });
        return;
    }
    
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect("/catalog/authors");
};

exports.authorUpdateGet = async (req, res, next) => {
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

exports.authorUpdatePost = [
    (req, res, next) => {
        const payload = req.body;
        if (!Array.isArray(payload.genre)) {
        payload.genre =
            typeof payload.genre === "undefined" ? [] : [payload.genre];
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
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
    body("genre.*").escape(),

    async (req, res, next) => {
        const payload = req.body;
        const params = req.params;
        const errors = validationResult(req);

        const book = new Book({
            title: payload.title,
            author: payload.author,
            summary: payload.summary,
            isbn: payload.isbn,
            genre: typeof payload.genre === "undefined" ? [] : payload.genre,
            _id: params.id,
        });

        if (!errors.isEmpty()) {
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().sort({ surnameame: 1 }).exec(),
                Genre.find().sort({ name: 1 }).exec(),
            ]);

        for (const genre of allGenres) {
            if (book.genre.indexOf(genre._id) > -1) {
            genre.checked = "true";
            }
        }
        res.render("bookForm", {
            title: "Update Book",
            authors: allAuthors,
            genres: allGenres,
            book,
            errors: errors.array(),
        });
        return;
        }

        const updatedBook = await Book.findByIdAndUpdate(params.id, book, {});
        res.redirect(updatedBook.url);
    }
];