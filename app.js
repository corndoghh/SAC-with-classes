const express = require("express")
const expressSession = require("express-session")
const { getUser, doesUserExist, addUser } = require("./scripts/UserManager")

const app = express()
const PORT = 3000


app.set("views engine", 'ejs')

app.use(express.static('public'))
app.use(express.urlencoded())
app.use(expressSession({
    secret: "7b6eZMeovUyQfFiKNSiZice0XIYa6",
    cookie: {},
    resave: false,
    saveUninitialized: false
}))


app.listen(PORT, () => {
    console.log("KYS NOWWW")
})

app.use((req, res, next) => {
    if (req.session.loggedIn === undefined) {
        req.session.loggedIn = false
        req.session.views = 0
        req.session.UUID = false
    }
    req.session.views += 1

    console.log(req.session.views)

    req.session.save()
    next()
})

//functions

const notFound = (req, res) => {
    res.status(404).send("404 not found")
}

const authentication = async (req, res) => {
    if (req.session.loggedIn) { console.log("already logged in"); return }
    const {token, email, tempCode} = req.query

    const type = req.url === "/login" ? "l" : req.url === "/sign-up" ? "s" : req.url === "/forgot-password" ? "f" : "r"

    if (
        type === "r" && 
        ((token === undefined || email === undefined || tempCode === undefined) ||
        await getHashedToken(email) !== token ||
        !await doesPropertyExist(email, "tempCode") ||
        await getUserValue(email, "tempCode") !== tempCode)
    ) { res.send("Invalid password reset link"); return }

    res.render("form-page.ejs", {type, token, email, tempCode})
}

const reqNoAuth = (req, res, next) => {
    if (!req.session.loggedIn) { next(); return }
    res.send("Error Already Logged In")
}


//get 
app.get('/', (req, res) => {
    res.render("main.ejs")
})

app.get('/about-us', (req, res) => {
    res.render("ourInfo.ejs")
})

app.get('/sign-up', reqNoAuth, authentication)
app.get('/signup', reqNoAuth, (req, res) => res.redirect('/sign-up'))
app.get('/login', reqNoAuth, authentication)
app.get('/forgot-password', reqNoAuth, authentication)
app.get('/reset-password', reqNoAuth, authentication)



//404 catch
app.get("*", notFound)

//post

//404 catch
app.post("*", notFound)



//test

const test = async () => {
    // const user = await getUser("the-caretaker")

    // console.log(await doesUserExist("the-caretaker"), await doesUserExist("the-caretakerbob"))

    // console.log(user)
    
    // await user.addProperty("FirstName")
    
    // await user.setValue("FirstName", "nowKYS")
    // await user.setValue("Some", 12)
    // console.log(user.getValue('Email'))

    await addUser("personal@harleyhugh.es", "endyourslv", ["k", "Another", "Name"], "Dylan", "MHM")
    
    const user = await getUser("personal@harleyhugh.es")
    
    user.createAccount("genusername", "aaaamog")

    console.log(await user.comparePasswordHash("aaaamog"))


}
test()