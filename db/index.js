const { Client } = require('pg'); // imports the pg module


// supply the database name & location of the db
const client = new Client('postgres://localhost:5432/juicebox-dev');


async function getAllUsers() {
    const {rows} = await client.query(
        `SELECT id, username, name, location, active
        FROM users;`
    );
    return rows;
}

async function createUser ({ username, password, name, location }) {
    try {
        const {rows: [user]} = await client.query(`
        INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
        RETURNING *;
    `, [username, password, name, location]);

        return user;
    } catch (error) {
        throw error;
    }
}

async function createPost({
    authorId,
    title,
    content
  }) {
    try {
        const {rows: [post]} = await client.query(`
        INSERT INTO posts("authorId", title, content)
        VALUES ($1, $2, $3)
        ON CONFLICT ("authorId") DO NOTHING
        RETURNING *;
    `, [authorId, title, content]);
    } catch (error) {
      throw error;
    }
  }
  

async function updateUser(id, fields = {}) {
    //build the set string
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

    //return early if this i called without fields
    if (setString.length === 0) {
        return;
    }

    try {
        const {rows: [user]} = await client.query(`
        UPDATE users
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
        `, Object.values(fields));
        return user;
    } catch (error) {
        throw error;
    }
}

async function updatePost(id, fields = {}) {
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

    if (setString.length === 0) {
        return;
    }
    try {
        const {rows: [post]} = await client.query(`
        UPDATE posts
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
        `, Object.values(fields));
        console.log(post);
        return post;
        
    } catch (error) {
      throw error;
    }
  }

  async function getAllPosts() {
    const {rows} = await client.query(
        `SELECT "authorId", title, content 
        FROM posts;`
    );
    return rows;
}

async function getPostsByUser(userId) {
    try {
        const {rows} = await client.query(`
        SELECT * FROM posts
        WHERE "authorId"=${userId}`);

        return rows;
    } catch (error) {
        throw error;
    }
}

async function getUserById(userId) {
    try {
        const {rows: [user]} = await client.query(`
        SELECT id, username, password, name, location
        FROM users
        WHERE id=${userId}
        `);

        delete user.password;

        if (!user) 
            {return null}

            user.posts = await getPostsByUser(user.id)
            return user;

    } catch (error) {
        throw error;
    }
    
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost, 
  updatePost,
  getAllPosts,
  getUserById,
  getPostsByUser
}
