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
    const params = req.params;

    const [author, all_books] = await Promise.all([
        Author.findById(params.id).populate("author").exec(),
        Book.find().sort({ family_name: 1 }).exec(),
    ]);

    if (author === null) {
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
    }

    res.render("authorForm", {
        title: "Update Author",
        author,
        books: all_books,
    });
};

exports.authorUpdatePost = [
    body("firstName", "First name must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("surname", "Surname must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("birthDate")
        .trim()
        .escape(),
    body("deathDate")
        .trim()
        .escape(),


    async (req, res, next) => {
        const body = req.body;
        const params = req.params;
        const errors = validationResult(req);

        const book = new Book({
            title: body.title,
            author: body.author,
            summary: body.summary,
            isbn: body.isbn,
            _id: params.id,
        });

        if (!errors.isEmpty()) {
            const [all_books] = await Promise.all([
                Book.find().sort({ name: 1 }).exec(),
            ]);
        

        res.render("authorForm", {
            title: "Update Author",
            author,
            books: all_books,
            errors: errors.array(),
        });
        return;
        }

        const updatedAuthor = await Author.findByIdAndUpdate(params.id, author, {});
        res.redirect(updatedAuthor.url);
    }
];