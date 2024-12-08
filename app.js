//express
const express = require("express")
const session = require("express-session")

//Mangers
const UserManager = require("./scripts/UserManager")
const BlogManager = require("./scripts/BlogManager")
const ImageManager = require("./scripts/ImageManager")

//Errors
const { ErrorHandling, UserError, UserErrorTypes, BlogError, BlogErrorTypes, ImageError, ImageErrorTypes, FormError, FormErrorTypes, WebError, WebErrorTypes } = require('./scripts/ErrorHandler')

//Middleware
const { reqNoAuth, reqAuth, reqData, reqUser, reqBlog, ownBlog, handleFormData, returnURL } = require('./scripts/Middleware')

//Misc
const Crypto = require('crypto')
const FileStore = require('session-file-store')(session);
const url = require('url');
const { sendConfirmationEmail, sendForgotPasswordEmail } = require("./scripts/EmailManager");

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
        req.session.Language = 'en'
    }

    req.session.views += 1

    req.session.save()

    const { error, message } = req.query

    res.locals.message = error ? error : message ? message : undefined

    res.locals.loggedIn = req.session.loggedIn
    res.locals.Language = req.session.Language

    next()
})

app.use(returnURL)

//functions

const checkMiddleware = (route, middlename) => {
    return app._router.stack
        .flatMap(layer => layer.route && layer.route.path === route ? layer.route.stack.filter(x => x.name === middlename) : [])
        .length > 0;
}

const notFound = (req, res) => { return ErrorHandling(new WebError(WebErrorTypes[404]), req, res) }

const authentication = async (req, res) => {
    if (req.session.loggedIn) { return ErrorHandling(new UserError(UserErrorTypes.ALREADY_LOGGED_IN, 409), req, res); }
    const { token, email, tempCode } = req.query

    const urlPath = url.parse(req.url).pathname

    const type = urlPath === "/login" ? "l" : urlPath === "/sign-up" ? "s" : urlPath === "/forgot-password" ? "f" : urlPath === "/add-account" ? "a" : "r"

    if (await (
        type === "r" &&
        ((token === undefined || email === undefined || tempCode === undefined) ||
            (async () => {
                const user = await userManager.getUser(email);
                if (!user) { return true }
                return (
                    ((Crypto.createHash("sha256").update(user.getValue("UUID") + user.getValue("Email")).digest("hex")) !== token) ||
                    !user.hasProperty('tempCode') ||
                    user.getValue('tempCode') !== tempCode
                )
            })())
    )) { return ErrorHandling(new FormError(FormErrorTypes.INCORRECT_DATA_SENT), req, res) }

    res.render("form-page.ejs", { type, token, email, tempCode, return_url: req.return_url })
}



const logout = async (req, res) => {
    req.session.UUID = undefined
    req.session.loggedIn = false
    const origin = url.parse(req.headers.referer)
    if (origin.pathname === 'login' || checkMiddleware(origin.pathname, "reqAuth")) {
        return req.session.save(() => res.redirect("/"))
    }
    req.session.save(() => res.redirect(origin.path))
}


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
    const { token, email } = req.query

    const user = await userManager.getUser(email)

    if (user.hasVerified()) { res.send("Email already verified"); return }
    if ((Crypto.createHash("sha256").update(user.getValue("UUID") + user.getValue("Email")).digest("hex")) !== token) { res.send("Invalid token"); return }

    await user.setValue('IsEmailVerified', true)

    res.redirect(user.hasAccount() ? '/login' : '/add-account')
})

app.get('/logout', reqAuth, logout)

app.get('/profile', reqAuth, (req, res) => {
    res.render('profile.ejs')
})


app.get('/profile/details', reqAuth, async (req, res) => {
    const user = await userManager.getUser(req.session.UUID)

    const Username = user.getValue("Username")
    const FirstName = user.getValue("FirstName")
    const LastName = user.getValue("LastName")
    const TwoFactor = user.getValue("TwoFactor")
    const Language = user.getValue("Language")


    res.setHeader('Cache-Control', 'no-store');
    res.json({ Username, FirstName, LastName, TwoFactor, Language })
})

app.get('/profile/pfp', reqAuth, async (req, res) => {
    const user = await userManager.getUser(req.session.UUID);
    res.setHeader('Cache-Control', 'no-store');
    res.contentType('image/jpeg');
    res.send(await user.getPFP())
})

app.get('/profile/dark-mode', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
        "isDarkMode": req.session.darkMode
    })
})

app.get('/profile/:details', reqData, async (req, res) => {
    if (req.query.lang !== undefined && ['en', 'es', 'fr', 'de'].includes(req.query.lang)) {
        req.session.Language = req.query.lang
        if (req.session.loggedIn && userManager.doesUserExist(req.session.UUID)) { (await userManager.getUser(req.session.UUID)).setValue('Language', req.query.lang) }
        return req.session.save(() => {
            return res.json({ 'message': 'Language Updated' })
        })
    }
    return ErrorHandling(new FormError(FormErrorTypes.INCORRECT_DATA_SENT, 409), req, res)
})

app.get('/blog', reqData, async (req, res) => {
    const { UUID } = req.query

    if (UUID === undefined) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_REQUEST, 409), req, res) }


    if (UUID.length === 0 && req.headers["content-type"] === 'application/json') { res.json((await blogManager.getBlogs()).map((blog) => blog.getUUID())); return }

    if (!(await blogManager.doesBlogExist(UUID))) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_BLOG_UUID, 404), req, res) }

    const blog = await blogManager.getBlog(UUID)

    if (req.query.image === 'true') {
        res.setHeader('Cache-Control', 'no-store');
        res.contentType('image/jpeg');
        return res.send(await blog.getBlogImage())
    }


    const blogData = {
        ...blog.getAllValues(),
        ...(await blog.getUsersname()),
        ...{ isOwner: blog.getAuthor() === req.session.UUID }
    }

    if (req.headers["content-type"] === 'application/json') {
        res.json(blogData)
        return
    }

    res.render('blog.ejs', { blogData })
})

app.get('/blog/edit', reqData, reqAuth, reqBlog, ownBlog, async (req, res) => {
    const { UUID } = req.query

    const blog = await blogManager.getBlog(UUID)


    const blogData = {
        ...blog.getAllValues(),
        ...(await blog.getUsersname()),
        ...{ isOwner: blog.getAuthor() === req.session.UUID }
    }

    res.render('edit-blog.ejs', { blogData })

})

app.get('/blog/create', reqAuth, async (req, res) => {
    res.render('edit-blog.ejs', {})
})


//404 catch
app.get("*", notFound)

//post

app.post("/auth", reqData, reqUser, reqNoAuth, async (req, res) => {
    const { Username, Email, Password } = req.body
    //if (!((Username || Email) && Password)) { return ErrorHandling(new FormError(FormErrorTypes.MISSING_REQUIRED_FIELD), req, res) }
    const identifier = Username ? Username : Email
    const user = await userManager.getUser(identifier)

    if (!user.hasAccount() || !user.comparePasswordHash(Password)) { return ErrorHandling(new UserError(UserErrorTypes.INCORRECT_CREDENTIALS, 400), req, res); }

    if (!user.hasVerified()) { return ErrorHandling(new UserError(UserErrorTypes.EMAIL_NOT_VERIFIED, 403), req, res); }

    await user.login(req)

    console.log(`Successfully logged in as ${identifier} using password ${Password}`)


    req.session.save(() => { res.json({ 'location': req.return_url }) })
})

app.post('/forgot-password', reqData, reqUser, reqNoAuth, async (req, res) => {
    const { Email } = req.body
    //if (!email) { return ErrorHandling(new FormError(FormErrorTypes.MISSING_REQUIRED_FIELD), req, res) }
    const user = await userManager.getUser(Email)
    if (!user.hasAccount()) {
        return ErrorHandling(new UserError(UserErrorTypes.ACCOUNT_DOES_NOT_EXIST), req, res)
    }
    if (!user.hasVerified()) { return ErrorHandling(new UserError(UserErrorTypes.EMAIL_NOT_VERIFIED, 403), req, res); }

    await sendForgotPasswordEmail(user)

    res.json({ "message": "Reset password email sent", 'location': '/' })
})

app.post('/reset-password', reqData, reqNoAuth, reqUser, async (req, res) => {
    const { token, email, tempCode, Password } = req.body
    console.log(req.body)

    const user = await userManager.getUser(email)

    if (await (
        ((token === undefined || email === undefined || tempCode === undefined) || Password == undefined ||
            (async () => {
                const user = await userManager.getUser(email);
                if (!user) { return true }
                return (
                    ((Crypto.createHash("sha256").update(user.getValue("UUID") + email).digest("hex")) !== token) ||
                    !user.hasProperty('tempCode') ||
                    user.getValue('tempCode') !== tempCode
                )
            })())
    )) { return ErrorHandling(new FormError(FormErrorTypes.INCORRECT_DATA_SENT), req, res) }

    await user.removeProperty('tempCode')
    await user.setPassword(Password)

    res.json({ 'message': 'Password Successfully reset', 'location': '/login' })
})


app.post("/sign-up", reqData, reqNoAuth, async (req, res) => {
    let { Email, FirstName, MiddleNames, LastName, Comment, Username, Password } = req.body

    if (
        Email === undefined ||
        FirstName === undefined ||
        LastName === undefined ||
        !String(Email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            )) { return ErrorHandling(new UserError(UserErrorTypes.INCORRECT_SIGNUP_CREDENTIALS, 422), req, res); }

    MiddleNames = MiddleNames ? MiddleNames : []

    if (await userManager.doesUserExist(Email)) { return ErrorHandling(new UserError(UserErrorTypes.USER_EXISTS, 409), req, res); }

    if (Username === '' || Username === undefined || Password === '' || Password === undefined) {
        const user = await userManager.addUser(Email, FirstName, MiddleNames, LastName, Comment);
        await sendConfirmationEmail(user)
        return res.json({ 'message': "You are signed up for the newsletter", 'location': req.return_url })
    }

    Username = Username.toLowerCase()

    if (await userManager.doesUserExist(Username)) { return ErrorHandling(new UserError(UserErrorTypes.USERNAME_TAKEN, 409), req, res); }

    const user = await userManager.addUser(Email, FirstName, MiddleNames, LastName, Comment);

    await sendConfirmationEmail(user)

    await user.createAccount(Username, Password)

    res.json({ 'message': 'Please verify email address', 'location': req.return_url })
})

app.post("/add-account", reqData, reqUser, reqNoAuth, async (req, res) => {
    let { Email, Username, Password } = req.body
    if (Email === undefined || Username === undefined || Password === undefined) { return ErrorHandling(new UserError(UserErrorTypes.INCORRECT_SIGNUP_CREDENTIALS, 422), req, res); }
    Username = Username.toLowerCase()

    const user = await userManager.getUser(Email)

    if (user.hasAccount()) { return ErrorHandling(new UserError(UserErrorTypes.ACCOUNT_ALREADY_EXISTS, 409), req, res); }

    if (await userManager.doesUserExist(Username)) { return ErrorHandling(new UserError(UserErrorTypes.USERNAME_TAKEN, 409), req, res); }

    await user.createAccount(Username, Password)

    if (user.hasVerified()) { await user.login(req) }

    req.session.save(() => { res.json({ 'message': 'Account Added!', 'location': req.return_url }) })
})


app.post('/profile/details', reqAuth, handleFormData, reqData, async (req, res) => {

    const user = await userManager.getUser(req.session.UUID)

    if (req.body['remove-pfp'] === true) { await user.deletePFP(); return res.status(200).json({ "message": "good", "location": req.return_url }) }


    const updatedInfo = Object.fromEntries(Object.entries(req.body).filter(([i, x]) => x !== ''))


    //TODO - Error handling !!!!!!!!!!!!

    //Password update
    if (updatedInfo.hasOwnProperty('OldPassword') && updatedInfo.hasOwnProperty('NewPassword')) {
        if (user.comparePasswordHash(updatedInfo["OldPassword"])) {
            if (updatedInfo["OldPassword"] !== updatedInfo["NewPassword"]) { await user.setPassword(updatedInfo["NewPassword"]) }
            else { return ErrorHandling(new UserError(UserErrorTypes.SAME_PASSWORD, 409), req, res) }
        }
        else { return ErrorHandling(new UserError(UserErrorTypes.INVALID_PASSWORD, 409), req, res) }
    }
    
    //Name update
    if (updatedInfo.hasOwnProperty('FirstName')) { await user.setValue('FirstName', updatedInfo["FirstName"]) }
    if (updatedInfo.hasOwnProperty('LastName')) { await user.setValue('LastName', updatedInfo["LastName"]) }
    if (updatedInfo.hasOwnProperty('Language') && ['en', 'es', 'fr', 'de'].includes(updatedInfo['Language'])) {
        req.session.Language = updatedInfo["Language"]
        await user.setValue('Language', updatedInfo["Language"])
    }
    if (updatedInfo.hasOwnProperty('TwoFactor') && updatedInfo["TwoFactor"] === 'on' && user.getValue('TwoFactor') === 'off') {
        await user.setValue('TwoFactor', updatedInfo["TwoFactor"])
        await user.setUpFIDO()
    }


    if (updatedInfo.hasOwnProperty('Username')) {
        if (updatedInfo['Username'] === user.getValue('Username')) { return ErrorHandling(new UserError(UserErrorTypes.SAME_DATA, 409), req, res) }
        if (await userManager.doesUserExist(updatedInfo['Username'])) { return ErrorHandling(new UserError(UserErrorTypes.USERNAME_TAKEN, 409), req, res) }
        await user.setValue('Username', updatedInfo["Username"])
    }

    if (req.image) {
        if (ImageManager.isImage(req.image.buffer)) { await user.setPFP(req.image) }
        else { return ErrorHandling(new ImageError(ImageErrorTypes.BUFFER_NOT_IMAGE, 409), req, res) }
    }

    res.status(200).json({ "message": "good", "location": req.return_url })
})


app.post('/profile/dark-mode', reqData, (req, res) => {
    const { darkMode } = req.body;
    req.session.darkMode = darkMode
    req.session.save(() => { res.json({ "message": "updated dark mode" }) })
})


app.post('/blog/create', reqAuth, handleFormData, reqData, async (req, res) => {

    if (!req.body || !req.image) { return ErrorHandling(new FormError(FormErrorTypes.MISSING_REQUIRED_FIELD, 400), req, res) }
    if (!ImageManager.isImage(req.image.buffer)) { return ErrorHandling(new ImageError(ImageErrorTypes.BUFFER_NOT_IMAGE, 409), req, res) }

    const { title, content, description } = req.body

    const blogData = Object.entries({ title, content, description }).filter(([i, x]) => (x !== undefined && x !== ''))


    // ===== Data Validation ===== 

    if (blogData.length !== 3) { return ErrorHandling(new BlogError(BlogErrorTypes.USER_MISSING_DATA, 409), req, res) }

    // ===== Data Validation =====

    //return res.status(400).json({ 'error': 'hey there' })


    const blog = await blogManager.addBlog(req.session.UUID, title, content, description, req.image)

    if (!blog) { return ErrorHandling(new BlogError(BlogErrorTypes.BLOG_ALREADY_EXISTS, 409), req, res) }

    res.json({ 'location': '/blog?UUID=' + blog.getUUID() })
})

app.post('/blog/delete', reqAuth, reqData, reqBlog, ownBlog, async (req, res) => { await blogManager.removeBlog(req.body.UUID); res.json({ 'message': 'removed', 'location': '/blogs' }) })

app.post('/blog/edit', reqAuth, handleFormData, reqData, reqBlog, ownBlog, async (req, res) => {

    const { title, content, description, UUID } = req.body;

    console.log(content)

    const edit = Object.entries({ title, content, description }).filter(([i, x]) => x !== undefined)

    // ===== Data Validation ===== 

    if (edit.length !== 3) { return ErrorHandling(new BlogError(BlogErrorTypes.USER_MISSING_DATA, 409), req, res) }

    // ===== Data Validation ===== 

    const blog = await blogManager.getBlog(UUID)
    await blog.setValues(Object.fromEntries(edit))
    if (req.image) {
        if (ImageManager.isImage(req.image.buffer)) { await blog.updateBlogImage(req.image) }
        else { return ErrorHandling(new ImageError(ImageErrorTypes.BUFFER_NOT_IMAGE, 409), req, res) }

    }
    console.log('/blog?UUID=' + UUID)
    res.json({ 'location': '/blog?UUID=' + blog.getUUID() })

})

app.post('/logout', reqAuth, logout)


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


    const user = await userManager.getUser('the-caretaker')

    if (user) {
        console.log(await user.getPFP())
    }

    // if (user) {
    //     const usersBlogs = await blogManager.getUsersBlogs(user)

    //     console.log(await blogManager.addBlog(user, 'NceaceaEaaaaaaaaaaaaaaaaaW', 'very aaaaaNaaaaEceaceaW', 'holy caaaaaeaceeeeeeashit'), "a")

    //     usersBlogs.forEach((blog) => console.log(blog.getAllValues()));

    //     //await blogManager.removeBlog(usersBlogs[1]);

    //     (await blogManager.getUsersBlogs(user)).forEach((blog) => console.log(blog.getAllValues()))
    // }


}

test()


