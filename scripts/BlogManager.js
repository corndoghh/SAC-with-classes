const DatabaseManager = require("./DatabaseManager")
const UserManager = require("./UserManager")
const User = require('./UserManager')
const { createHash, randomUUID } = require('crypto')

const userManager = new UserManager()

class Blog {

    #user
    #title
    #content
    #description
    #blogHash
    #UUID

    /**
     * 
     * @param {User} user 
     * @param {string} title 
     * @param {string} content 
     * @param {string} description 
     */
    constructor(user, title, content, description, blogHash = undefined, UUID = undefined) {
        if (user.constructor.name === 'User') { this.#user = user.getValue('UUID') }
        else { this.#user = user } 
        this.#title = title
        this.#content = content
        this.#description = description
        this.#blogHash = blogHash === undefined ? createHash('sha256').update(title+content).digest('base64') : blogHash
        this.#UUID = UUID === undefined ? randomUUID() : UUID
    }


    getAllValues = () => {
        return {
            "title": this.getTitle(),
            "author": this.getAuthor(),
            "content": this.getContent(),
            "description": this.getDescription(),
            "blogHash": this.getBlogHash(),
            "UUID": this.getUUID()
        }
    }

    updateAllValues = async (newValues) => {
        await (new DatabaseManager('blogs.json')).updateEntry(this.getAllValues(), newValues)
        this.#user = newValues.author
        this.#title = newValues.title
        this.#content = newValues.content
        this.#description = newValues.description
        this.#blogHash = createHash('sha256').update(this.#title+this.#content).digest('base64');


        //console.log(newValues)

         
    }

    setValues = async (edit) => {
        const newValues = this.getAllValues()

        Object.entries(edit).forEach(([key, value]) => {
            newValues[key] = value
        })
        newValues['blogHash'] = createHash('sha256').update(newValues['title']+newValues['content']).digest('base64');
        await this.updateAllValues(newValues)
        
    }
    
    getTitle = () => { return this.#title }
    getAuthor = () => { return this.#user }
    getUser = async () => { return await userManager.getUser(this.getAuthor()) }
    getContent = () => { return this.#content }
    getDescription = () => { return this.#description }
    getBlogHash = () => { return this.#blogHash }
    getUUID = () => { return this.#UUID }
    getUsersname = async () => { 
        const user = await userManager.getUser(this.getAuthor())
        return {
            "FirstName": user.getValue('FirstName'),
            "LastName": user.getValue('LastName')
        }
    }


    

}

module.exports = class BlogManager {

    static databaseManager = new DatabaseManager('blogs.json')

    constructor() {}

    /**
     * 
     * @param {User} user 
     * @param {string} title 
     * @param {string} content 
     * @param {string} description
     * @returns {boolean, Blog} 
     */
    addBlog = async (user, title, content, description) => {
        const blog = new Blog(user, title, content, description)


        if (await this.doesBlogExist(blog.getBlogHash())) { return false }

        // if (blog.getBlogHash())
        await BlogManager.databaseManager.addEntry(blog.getAllValues())
        return blog
    }

    /**
     * @param {Blog, string} blog
     * @returns {boolean}
     */
    removeBlog = async (identifier) => {
        const blog = await this.getBlog(identifier)
        await BlogManager.databaseManager.deleteEntry(blog.getAllValues())

        return !(await this.doesBlogExist(identifier))
    }

    getBlogs = async () => { 
        const blogData = await BlogManager.databaseManager.readDatabase()
        
        return await Promise.all(blogData.map(async (blog) => new Blog(await userManager.getUser(blog.author), blog.title, blog.content, blog.description, blog.blogHash, blog.UUID)))
    }

    /**
     * 
     * @param {*} identifier 
     * @returns {Blog} 
     */

    getBlog = async (identifier) => {
        const blogs = await this.getBlogs()
        return blogs.filter((blog) => (blog.getUUID() === identifier || blog.getBlogHash() === identifier || (identifier.constructor.name === 'User' && blog.getUUID() === identifier.getUUID())))[0]
    }

    /**
     * @param {User, string} user
     * @returns {Blog[]}
     */
    getUsersBlogs = async (user) => {
        const blogs = await this.getBlogs()
        if (user.constructor.name === 'User') {
            return blogs.filter((blog) => blog.getAuthor() === user.getValue('UUID'))
        }
        return blogs.filter((blog) => blog.getAuthor() === user)
    }


    doesBlogExist = async (identifier) => { return await this.getBlog(identifier) === undefined ? false : true }

    /**
     * 
     * @param {User} user
     * @returns {boolean} 
     */
    removeAllUsersBlogs = async (user) => {
        const blogs = this.getUsersBlogs(user)

        blogs.forEach(x => { this.removeBlog(x) })

        return this.getUsersBlogs().length === 0 ? true : false
    }



}