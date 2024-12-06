//express
const express = require("express")
const session = require("express-session")

//Mangers
const UserManager = require("./scripts/UserManager")
const BlogManager = require("./scripts/BlogManager")
const ImageManager = require("./scripts/ImageManager")

//Errors
const { ErrorHandling, UserError, UserErrorTypes, BlogError, BlogErrorTypes, ImageError, ImageErrorTypes, FormError, FormErrorTypes } = require('./scripts/ErrorHandler')

//Middleware
const { reqNoAuth, reqAuth, reqData, reqUser, reqBlog, ownBlog, handleFormData } = require('./scripts/Middleware')

//Misc
const Crypto = require('crypto')
const FileStore = require('session-file-store')(session);
const url = require('url');
const { sendConfirmationEmail } = require("./scripts/EmailManager");
const { formatFormData } = require("./scripts/GlobalFunction")

const app = express();
const PORT = 3000


app.set("views engine", 'ejs')

app.use(express.static('public'))
app.use(express.json({ limit: '50mb' }))
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

    res.locals.loggedIn = req.session.loggedIn
    res.locals.Language = req.session.Language

    next()
})

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



const logout = (req, res) => {
    req.session.UUID = undefined
    req.session.loggedIn = false
    req.session.save(() => res.redirect("/"))
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
    const {token, email} = req.query
    
    const user = await userManager.getUser(email)

    //TODO - json data 
    if (user.hasVerified()) { res.send("Email already verified"); return }
    if ((Crypto.createHash("sha256").update(user.getValue("UUID")+user.getValue("Email")).digest("hex")) !== token) { res.send("Invalid token"); return }

    await user.setValue('IsEmailVerified', true)

    //DO TO what to do with clients after email verification
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
    console.log(req.session.darkMode)
    res.json({
        "isDarkMode": req.session.darkMode
    })
})

app.get('/profile/:details', reqData, async (req, res) => {
    console.log('a')
    if (req.query.lang !== undefined) {
        req.session.Language = req.query.lang
        return req.session.save(() => {
            return res.json({ 'Message': 'Language Updated' })
        })
    }
})

app.get('/:blog', reqData, async (req, res) => {
    console.log(req.query.image)
    const { UUID } = req.query
    
    if (UUID === undefined) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_REQUEST, 409), res) }


    if (UUID.length === 0 && req.headers["content-type"] === 'application/json') { res.json((await blogManager.getBlogs()).map((blog) => blog.getUUID())); return }

    if (!(await blogManager.doesBlogExist(UUID))) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_BLOG_HASH, 404), res) }

    const blog = await blogManager.getBlog(UUID)

    if (req.query.image === 'true') {
        res.setHeader('Cache-Control', 'no-store');
        res.contentType('image/jpeg');
        return res.send(await blog.getBlogImage())
    }


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

    if (
        Email === undefined ||
        FirstName === undefined ||
        LastName === undefined ||
        !String(Email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )) { return ErrorHandling(new UserError(UserErrorTypes.INCORRECT_SIGNUP_CREDENTIALS, 422), res); }

    MiddleNames = MiddleNames ? MiddleNames : []

    if (await userManager.doesUserExist(Email)) { return ErrorHandling(new UserError(UserErrorTypes.USER_EXISTS, 409), res); }

    if (Username === '' || Username === undefined || Password === '' || Password === undefined) {
        const user = await userManager.addUser(Email, FirstName, MiddleNames, LastName, Comment);
        await sendConfirmationEmail(user)
        return res.json({ 'Message': "You are signed up for the newsletter" })
    }

    //TODO - handle newsletter sign up 
    
    Username = Username.toLowerCase()
    
    if (await userManager.doesUserExist(Username)) { return ErrorHandling(new UserError(UserErrorTypes.USERNAME_TAKEN, 409), res); }
    
    const user = await userManager.addUser(Email, FirstName, MiddleNames, LastName, Comment);
    
    await sendConfirmationEmail(user)
    
    await user.createAccount(Username, Password)

    //DO TO what to do with clients after account created
    res.redirect(`${(returnUrl !== '' && returnUrl !== undefined)  ? returnUrl : '/'}`)
})

app.post("/add-account", reqData, reqUser, reqNoAuth, async (req, res) => {
    let { Email, Username, Password, returnUrl } = req.body
    if (Email === undefined || Username === undefined || Password === undefined) { return ErrorHandling(new UserError(UserErrorTypes.INCORRECT_SIGNUP_CREDENTIALS, 422), res); }
    Username = Username.toLowerCase()

    const user = await userManager.getUser(Email)

    if (user.hasAccount()) { return ErrorHandling(new UserError(UserErrorTypes.ACCOUNT_ALREADY_EXISTS, 409), res); }

    if (await userManager.doesUserExist(Username)) { return ErrorHandling(new UserError(UserErrorTypes.USERNAME_TAKEN, 409), res); }

    await user.createAccount(Username, Password)

    if (user.hasVerified()) {
        await user.login(req)
    }

    //DO TO what to do with clients after account created
    req.session.save(() => {
        res.redirect(`${returnUrl !== '' ? returnUrl : '/'}`)
    })
})


app.post('/profile/details', reqAuth, handleFormData, reqData, async (req, res) => {

    const user = await userManager.getUser(req.session.UUID)

    if (req.body['remove-pfp'] === true) { await user.deletePFP(); return res.status(200).json({ "all": "good" })}
    
    
    const updatedInfo = Object.fromEntries(Object.entries(req.body).filter(([i, x]) => x !== ''))

    console.log(updatedInfo)

    //TODO - Error handling !!!!!!!!!!!!

    //Password update
    if (updatedInfo.hasOwnProperty('OldPassword')) {
        if (user.comparePasswordHash(updatedInfo["OldPassword"])) {
            if (updatedInfo["OldPassword"] !== updatedInfo["NewPassword"]) { await user.setPassword(updatedInfo["NewPassword"]) }
            else { return ErrorHandling(new UserError(UserErrorTypes.SAME_PASSWORD, 409), res) }
        }
        else { return ErrorHandling(new UserError(UserErrorTypes.INVALID_PASSWORD, 409), res) }        
    }
    //Name update
    if (updatedInfo.hasOwnProperty('FirstName')) { await user.setValue('FirstName', updatedInfo["FirstName"]) }
    if (updatedInfo.hasOwnProperty('LastName')) { await user.setValue('LastName', updatedInfo["LastName"]) }
    if (updatedInfo.hasOwnProperty('Language')) {
        req.session.Language = updatedInfo["Language"]
        await user.setValue('Language', updatedInfo["Language"])
    }
    if (updatedInfo.hasOwnProperty('TwoFactor')) { await user.setValue('TwoFactor', updatedInfo["TwoFactor"]) }


    if (updatedInfo.hasOwnProperty('Username')) {
        if (updatedInfo['Username'] === user.getValue('Username')) { return ErrorHandling(new UserError(UserErrorTypes.SAME_DATA, 409), res) }
        if (await userManager.doesUserExist(updatedInfo['Username'])) { return ErrorHandling(new UserError(UserErrorTypes.USERNAME_TAKEN, 409), res) }
        await user.setValue('Username', updatedInfo["Username"])
    }

    if (req.image) {
        if (ImageManager.isImage(req.image.buffer)) { await user.setPFP(req.image) }
        else { return ErrorHandling(new ImageError(ImageErrorTypes.BUFFER_NOT_IMAGE, 409), res) }
    }

    res.status(200).json({ "all": "good" })
})

// app.post('/upload-picture', reqAuth, async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
//     }
//     res.status(200).json({
//         message: 'Image uploaded successfully!',
//         file: req.file
//     });
// })

app.post('/profile/dark-mode', reqData, (req, res) => {
    const { darkMode } = req.body;
    req.session.darkMode = darkMode
    console.log(darkMode, req.session.darkMode)
    req.session.save(() => {
        res.json({ "Message": "updated dark mode" })
    })
})


app.post('/blog/create', reqAuth, handleFormData, reqData, async (req, res) => {

    if (!req.body || !req.image) { return ErrorHandling(new FormError(FormErrorTypes.MISSING_REQUIRED_FIELD, 400), res) }

    const { title, content, description } = req.body

    const blogData = Object.entries({title,content,description}).filter(([i, x]) => (x !== undefined && x !== ''))


    // ===== Data Validation ===== 

    if (blogData.length !== 3) { return ErrorHandling(new BlogError(BlogErrorTypes.USER_MISSING_DATA, 409), res) }

    // ===== Data Validation =====

    //return res.status(400).json({ 'error': 'hey there' })


    const blog = await blogManager.addBlog(req.session.UUID, title, content, description, req.image)

    if (!blog) { return ErrorHandling(new BlogError(BlogErrorTypes.BLOG_ALREADY_EXISTS, 409), res) }

    res.json({ 'location': '/blog?UUID='+blog.getUUID() })
})

app.post('/blog/delete', reqAuth, reqData, reqBlog, ownBlog, async (req, res) => { const response = await blogManager.removeBlog(req.body.UUID); res.json({'success': response})})

app.post('/blog/edit', reqAuth, handleFormData, reqData, reqBlog, ownBlog, async (req, res) => {

    const { title, content, description, UUID } = req.body;
    
    console.log(content)

    const edit = Object.entries({title,content,description}).filter(([i, x]) => x !== undefined)
    
    // ===== Data Validation ===== 

    if (edit.length !== 3) { return ErrorHandling(new BlogError(BlogErrorTypes.USER_MISSING_DATA, 409), res) }

    // ===== Data Validation ===== 

    const blog = await blogManager.getBlog(UUID)
    await blog.setValues(Object.fromEntries(edit))
    if (req.image) {
        await blog.updateBlogImage(req.image)
    }
    console.log('/blog?UUID='+UUID)
    res.json({ 'location': '/blog?UUID='+blog.getUUID() })

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
