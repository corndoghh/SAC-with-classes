const express = require("express")
const session = require("express-session")
const UserError = require("./Errors/UserError")
const UserErrorTypes = require("./Errors/UserErrorTypes")
const FileStore = require('session-file-store')(session);
const multer = require('multer');
const path = require('path')
const fs = require('fs')
const url = require('url');
const BlogManager = require("./scripts/BlogManager")
const UserManager = require("./scripts/UserManager");
const BlogError = require("./Errors/BlogError");
const BlogErrorTypes = require("./Errors/BlogErrorTypes");
const { sendConfirmationEmail } = require("./scripts/EmailManager");
const Crypto = require('crypto')


const app = express();
const PORT = 3000


app.set("views engine", 'ejs')

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    store: new FileStore(),
    secret: "7b6eZMeovUyQfFiKNSiZice0XIYa6",
    cookie: {},
    resave: true,
    saveUninitialized: true
}))

const blogManager = new BlogManager()
const userManager = new UserManager()

app.listen(PORT, () => {
    console.log("KYS NOWWW")
})

app.use((req, res, next) => {
    if (req.session.loggedIn === undefined) {
        req.session.loggedIn = false
        req.session.views = 0
        req.session.UUID = false
        req.session.darkMode = false
    }
    req.session.views += 1

    req.session.save()

    res.locals.loggedIn = req.session.loggedIn

    next()
})

//Error handling Middleware

/**
 * 
 * @param {UserError, BlogError} err 
 * @param {*} res 
 * @returns {}
 */
const ErrorHandling = (err, res) => { return res.status(err.statusCode).json({ error: err.message }); }

//functions

const notFound = (req, res) => { res.status(404).send("404 not found") }

const authentication = async (req, res) => {
    if (req.session.loggedIn) { return ErrorHandling(new UserError(UserErrorTypes.ALREADY_LOGGED_IN, 409), res); }
    const { token, email, tempCode } = req.query

    const urlPath = url.parse(req.url).pathname

    const { return_url } = req.query

    const type = urlPath === "/login" ? "l" : urlPath === "/sign-up" ? "s" : urlPath === "/forgot-password" ? "f" : urlPath === "/add-account" ? "a" : "r"

    if (
        type === "r" &&
        ((token === undefined || email === undefined || tempCode === undefined) ||
            await getHashedToken(email) !== token ||
            !await doesPropertyExist(email, "tempCode") ||
            await getUserValue(email, "tempCode") !== tempCode)
    ) { res.json({ "Error": "Invalid password reset link" }); return }

    res.render("form-page.ejs", { type, token, email, tempCode, return_url })
}

const reqNoAuth = (req, res, next) => {
    if (!req.session.loggedIn) { next(); return }
    return ErrorHandling(new UserError(UserErrorTypes.ALREADY_LOGGED_IN, 409), res);
}

const reqData = (req, res, next) => {
    const isGetMethod = req.method === 'GET';
    const hasData = isGetMethod ? Object.keys(req.query).length > 0 : Object.keys(req.body).length > 0;

    if (!hasData) { res.json({ "Error": "No data sent" }); return }
    next();
}

const reqUser = async (req, res, next) => {
    if ((await Promise.all((Object.values(req.body).length !== 0 ? Object.values(req.body) : Object.values(req.query).length !== 0 ? Object.values(req.query) : [req.session.UUID]).map(async (x) => {
        if (await userManager.doesUserExist(x)) { return true }
    }))).filter((x) => x !== undefined)[0]) { next(); return }

    return ErrorHandling(new UserError(UserErrorTypes.USER_NOT_EXIST, 404), res);
}

const reqAuth = async (req, res, next) => {
    if (req.session.loggedIn) { next(); return }
    res.redirect(`/login?return_url=${req.originalUrl}`)
}

const reqBlog = async (req, res, next) => {
    const isGetMethod = req.method === 'GET';
    const { UUID } = isGetMethod ? req.query : req.body;

    // ===== Data Validation ===== 

    if (UUID === undefined) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_REQUEST, 409), res) }


    if (!(await blogManager.doesBlogExist(UUID))) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_BLOG_HASH, 404), res) }

    // ===== Data Validation ===== 

    next()

}

const ownBlog = async (req, res, next) => {
    const isGetMethod = req.method === 'GET';
    const { UUID } = isGetMethod ? req.query : req.body;


    const blog = await blogManager.getBlog(UUID)

    // ===== Ownership verification =====

    if (blog.getAuthor() !== req.session.UUID) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_BLOG_OWNERSHIP, 403), res) }


    next()

}

const logout = (req, res) => {
    req.session.UUID = undefined
    req.session.loggedIn = false
    req.session.save(() => {
        res.redirect("/")
    })
}

//============= TODO maybe move to DatabaseManager.js =============

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Set upload directory
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Set unique file name
        cb(null, req.session.UUID + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('File is not an image'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

//============= TODO maybe move to DatabaseManager.js =============


//get 
app.get('/', (req, res) => {
    res.render("main.ejs")
})

app.get('/about-us', (req, res) => {
    res.render("about-us.ejs")
})

app.get('/faq', (req, res) => {
    res.render("faq.ejs")
})

app.get('/goals/climate-change', (req, res) => {
    res.render('goals/climate-change.ejs')
})

app.get('/goals/sustainable-cities', (req, res) => {
    res.render('goals/sustainable-cities.ejs')
})

app.get('/goals/zero-hunger', (req, res) => {
    res.render('goals/zero-hunger.ejs')
})

app.get('/blogs', (req, res) => {
    res.render('blogs.ejs')
})


app.get('/sign-up', reqNoAuth, authentication)
app.get('/signup', reqNoAuth, (req, res) => res.redirect('/sign-up'))
app.get('/add-account', reqNoAuth, authentication)
app.get('/login', reqNoAuth, authentication)
app.get('/forgot-password', reqNoAuth, authentication)
app.get('/reset-password', reqNoAuth, authentication)

app.get('/verify', reqData, reqUser, async (req, res) => {
    const {token, email} = req.query
    
    const user = await userManager.getUser(email)

    //TODO - json data 
    if (user.hasVerified()) { res.send("Email already verified"); return }
    if ((Crypto.createHash("sha256").update(user.getValue("UUID")+user.getValue("Email")).digest("hex")) !== token) { res.send("Invalid token"); return }

    await user.setValue('IsEmailVerified', true)

    //DO TO what to do with clients after email verification
    res.redirect('/login')
})

app.get('/logout', reqUser, reqAuth, logout)

app.get('/profile', reqAuth, (req, res) => {
    res.render('profile.ejs')
})

app.get('/profile/details', reqAuth, async (req, res) => {
    const user = await userManager.getUser(req.session.UUID)

    const Username = user.getValue("Username")
    const FirstName = user.getValue("FirstName")
    const LastName = user.getValue("LastName")
    const TwoFactor = user.getValue("TwoFactor")

    res.setHeader('Cache-Control', 'no-store');
    res.json({ Username, FirstName, LastName, TwoFactor })
})

app.get('/profile/pfp', reqAuth, async (req, res) => {
    fs.readdir(__dirname + '/uploads/', (err, files) => {
        let headersSent = false
        files.forEach((file) => {
            if (file.split('.')[0] === req.session.UUID) {
                res.setHeader('Cache-Control', 'no-store');
                res.sendFile(__dirname + "/uploads/" + file);
                headersSent = true;
            }

        })
        if (!headersSent) { return notFound(req, res) }
    });
})

app.get('/profile/dark-mode', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
        "isDarkMode": req.session.darkMode
    })
})

app.get('/:blog', reqData, async (req, res) => {
    const { UUID } = req.query

    if (UUID === undefined) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_REQUEST, 409), res) }


    if (UUID.length === 0 && req.headers["content-type"] === 'application/json') { res.json((await blogManager.getBlogs()).map((blog) => blog.getUUID())); return }

    if (!(await blogManager.doesBlogExist(UUID))) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_BLOG_HASH, 404), res) }

    const blog = await blogManager.getBlog(UUID)


    const blogData = {
        ...blog.getAllValues(),
        ...(await blog.getUsersname()),
        ...{isOwner: blog.getAuthor() === req.session.UUID}
    }

    if (req.headers["content-type"] === 'application/json') {
        res.json(blogData)
        return
    }

    res.render('blog.ejs', {blogData})
})

app.get('/blog/edit', reqData, reqAuth, reqBlog, ownBlog, async (req, res) => {
    const { UUID } = req.query

    const blog = await blogManager.getBlog(UUID)


    const blogData = {
        ...blog.getAllValues(),
        ...(await blog.getUsersname()),
        ...{isOwner: blog.getAuthor() === req.session.UUID}
    }
    
    res.render('edit-blog.ejs', {blogData})

}) 

app.get('/blog/create', reqAuth, async (req, res) => {
    res.render('edit-blog.ejs', {})
})


//404 catch
app.get("*", notFound)

//post

app.post("/auth", reqData, reqUser, reqNoAuth, async (req, res) => {
    const { Username, Email, Password, returnUrl } = req.body

    if (!((Username || Email) && Password)) { res.json({ "Error": "Invalid data submitted" }); return }
    const identifier = Username ? Username : Email

    const user = await userManager.getUser(identifier)

    if (!user.hasAccount() || !user.comparePasswordHash(Password)) { return ErrorHandling(new UserError(UserErrorTypes.INCORRECT_CREDENTIALS, 400), res); }

    if (!user.hasVerified()) { return ErrorHandling(new UserError(UserErrorTypes.EMAIL_NOT_VERIFIED, 403), res); }

    //if (!(await doesUserHaveAccount(identifier)) || !(await isPasswordCorrect(identifier, Password))) { res.send("Incorrect Username or Password"); return } 

    await user.login(req)

    console.log(`Successfully logged in as ${identifier} using password ${Password}`)

    
    req.session.save(() => {
        if (returnUrl) {
            res.redirect(`${returnUrl !== '' ? returnUrl : '/'}`)
            return
        }
        res.redirect('/')
    })
    //DO TO what to do with clients after successfull authentication...
    //res.redirect("/")
})

app.post('/forgot-password', reqData, reqUser, reqNoAuth, async (req, res) => {
    const { email } = req.body


    //await sendForgotPasswordEmail(email)

    //DO TO what to do with clients after password reset email sent
    res.send("Reset password email sent")
})



app.post("/sign-up", reqData, reqNoAuth, async (req, res) => {
    let { Email, FirstName, MiddleNames, LastName, Comment, Username, Password, returnUrl } = req.body
    console.log(req.body)
    if (Email === undefined || FirstName === undefined || LastName === undefined) { return ErrorHandling(new UserError(UserErrorTypes.INCORRECT_SIGNUP_CREDENTIALS, 409), res); }

    MiddleNames = MiddleNames ? MiddleNames : []

    if (await userManager.doesUserExist(Email)) { return ErrorHandling(new UserError(UserErrorTypes.USER_EXISTS, 409), res); }


    const user = await userManager.addUser(Email, FirstName, MiddleNames, LastName, Comment);

    await sendConfirmationEmail(user)
    

    //TODO - handle newsletter sign up 
    if (Username === '' || Password === '') { res.send("You are signed up for the newsletter"); return }
    
    if (await userManager.doesUserExist(Username)) { return ErrorHandling(new UserError(UserErrorTypes.USERNAME_TAKEN, 409), res); }
    
    await user.createAccount(Username, Password)

    //DO TO what to do with clients after account created
    req.session.save(() => {
        res.redirect(`${returnUrl !== '' ? returnUrl : '/'}`)
    })
})

app.post("/add-account", reqData, reqUser, reqNoAuth, async (req, res) => {
    const { Email, Username, Password } = req.body
    if (Email === undefined || Username === undefined || Password === undefined) { return ErrorHandling(new UserError(UserErrorTypes.INCORRECT_SIGNUP_CREDENTIALS, 409), res); }

    const user = await userManager.getUser(Email)

    if (user.hasAccount()) { return ErrorHandling(new UserError(UserErrorTypes.ACCOUNT_ALREADY_EXISTS, 409), res); }

    if (await userManager.doesUserExist(Username)) { return ErrorHandling(new UserError(UserErrorTypes.USERNAME_TAKEN, 409), res); }

    await user.createAccount(Username, Password)

    await user.login(req)

    //DO TO what to do with clients after account created
    req.session.save(() => {
        res.send("Account has been created")
    })
})


app.post('/update-details', reqAuth, reqData, async (req, res) => {
    const user = await userManager.getUser(req.session.UUID)

    const updatedInfo = Object.fromEntries(Object.entries(req.body).filter(([i, x]) => x !== ''))

    console.log(updatedInfo)

    //TODO - Error handling

    //Password update
    if (updatedInfo.hasOwnProperty('OldPassword') && user.comparePasswordHash(updatedInfo["OldPassword"]) && updatedInfo["OldPassword"] !== updatedInfo["NewPassword"]) { await user.setPassword(updatedInfo["NewPassword"]) }

    //Name update
    if (updatedInfo.hasOwnProperty('FirstName')) { await user.setValue('FirstName', updatedInfo["FirstName"]) }
    if (updatedInfo.hasOwnProperty('LastName')) { await user.setValue('LastName', updatedInfo["LastName"]) }
    if (updatedInfo.hasOwnProperty('Language')) { await user.setValue('Language', updatedInfo["Language"]) }
    if (updatedInfo.hasOwnProperty('TwoFactor')) { await user.setValue('TwoFactor', updatedInfo["TwoFactor"]) }


    if (updatedInfo.hasOwnProperty('Username')) {
        if (await userManager.doesUserExist(updatedInfo['Username'])) { return ErrorHandling(new UserError(UserErrorTypes.USERNAME_TAKEN, 409), res) }
        await user.setValue('Username', updatedInfo["Username"])
    }


    res.status(200).json({ "all": "good" })
})

app.post('/upload-picture', reqAuth, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
    }
    res.status(200).json({
        message: 'Image uploaded successfully!',
        file: req.file
    });

})

app.post('/profile/dark-mode', reqData, (req, res) => {
    const { darkMode } = req.body;
    req.session.darkMode = darkMode
    console.log(darkMode, req.session.darkMode)
    req.session.save(() => {
        res.json({ "good": "good" })
    })
})


app.post('/blog/create', reqAuth, reqData, async (req, res) => {

    const { title, content, description } = req.body

    const blogData = Object.entries({title,content,description}).filter(([i, x]) => x !== undefined)


    // ===== Data Validation ===== 

    if (blogData.length === 0) {
        return ErrorHandling(new BlogError(BlogErrorTypes.USER_MISSING_DATA, 409), res)
    }

    // ===== Data Validation =====

    const blog = await blogManager.addBlog(req.session.UUID, title, content, description)

    if (!blog) { return ErrorHandling(new BlogError(BlogErrorTypes.BLOG_ALREADY_EXISTS, 409), res) }

    res.redirect('/blog?UUID='+blog.getUUID())
})

app.post('/blog/delete', reqAuth, reqData, reqBlog, ownBlog, async (req, res) => { const response = await blogManager.removeBlog(req.body.UUID); res.json({'success': response})})

app.post('/blog/edit', reqAuth, reqData, reqBlog, ownBlog, async (req, res) => {
    const { title, content, description, UUID } = req.body;

    console.log(content)


    const edit = Object.entries({title,content,description}).filter(([i, x]) => x !== undefined)
    
    // ===== Data Validation ===== 

    if (edit.length === 0) {
        return ErrorHandling(new BlogError(BlogErrorTypes.USER_MISSING_DATA, 409), res)
    }

    // ===== Data Validation ===== 

    
    const blog = await blogManager.getBlog(UUID)
    await blog.setValues(Object.fromEntries(edit))
    console.log('/blog?UUID='+UUID)
    res.redirect('/blog?UUID='+UUID)
})


app.post('/logout', reqUser, reqAuth, logout)


//404 catch
app.post("*", notFound)



//test

const test = async () => {
    // const user = await userManager.getUser("the-caretaker")

    // console.log(await userManager.doesUserExist("the-caretaker"), await userManager.doesUserExist("the-caretakerbob"))

    // console.log(user)

    // await user.addProperty("FirstName")

    // await user.setValue("FirstName", "nowKYS")
    // await user.setValue("Some", 12)
    // console.log(user.getValue('Email'))

    // await userManager.addUser("personal@harleyhugh.es", "endyourslv", ["k", "Another", "Name"], "Dylan", "MHM")

    // const user = await userManager.getUser("personal@harleyhugh.es")

    // user.createAccount("genusername", "aaaamog")

    // console.log(await user.comparePasswordHash("aaaamog"))


    const user = await userManager.getUser('71f75431-fa01-469d-8eb3-10c020ec4fd7')


    const usersBlogs = await blogManager.getUsersBlogs(user)

    console.log(await blogManager.addBlog(user, 'NceaceaEaaaaaaaaaaaaaaaaaW', 'very aaaaaNaaaaEceaceaW', 'holy caaaaaeaceeeeeeashit'), "a")

    usersBlogs.forEach((blog) => console.log(blog.getAllValues()));

    //await blogManager.removeBlog(usersBlogs[1]);

    (await blogManager.getUsersBlogs(user)).forEach((blog) => console.log(blog.getAllValues()))

}

test()