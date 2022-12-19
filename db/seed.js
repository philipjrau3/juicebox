// grab our client with destructuring from the export in index.js
const { get } = require('http');
const { client, getAllUsers, createUser, updateUser, createPost, updatePost, getAllPosts, getUserById, getPostsByUser, createTags, addTagsToPost, getPostById, getPostsByTagName } = require('./index');

async function createInitialUsers() {
    try {
        //console.log("Starting to create users...")

        await createUser 
        ({ 
        username: 'albert', 
        password: 'bertie99', 
        name: 'albert',
        location: 'Alberta, CA'
        });
        await createUser 
        ({
        username: 'sandra', 
        password: '2sandy4me',
        name: 'sandra',
        location: 'Sunny California'
        });
        await createUser 
        ({
          username: 'glamgal', 
          password: 'soglam',
          name: 'becky',
          location: 'Boca Raton, FL'
        });
        // console.log(albert); console.log(sandra);

        //console.log("Finished creating user!");
    } catch(error) {
        //console.error("Error creating user!");
        throw error;
    }
}

async function createInitialPosts (){
  try {
    const [albert, sandra, glamgal] = await getAllUsers();

    await createPost({
      authorId: albert.id,
      title: "First Post",
      content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
      tags: ["#happy", "#youcandoanything"]
    });

    await createPost({
      authorId: sandra.id,
      title: "My first post",
      content: "I hate posting but my teacher made me.",
      tags: ["#happy", "#worst-day-ever"]
    });
    
  } catch (error) {
    throw error;
  }
}

// this function should call a query which drops all tables from our database
async function dropTables() {
    try {
      
        //console.log("Starting drop tables...");

        await client.query(`
      DROP TABLE IF EXISTS post_tags;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users;

        `);

    
      

      //console.log("Finished dropping tables!")
    } catch (error) {
        //console.error("Error dropping tables!")
      throw error; // we pass the error up to the function that calls dropTables
    }
  }
  
  // this function should call a query which creates all tables for our database 
  async function createTables() {
    try {
        //console.log("Starting build tables...")

      await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username varchar(255) UNIQUE NOT NULL,
                password varchar(255) NOT NULL,
                name varchar(255) NOT NULL,
                location varchar(255) NOT NULL,
                active BOOLEAN DEFAULT true
            );
      `)                  /* again, "authorId", foreign keys need double quotes & INT REF*/
        await client.query(`
        CREATE TABLE posts(
        id SERIAL PRIMARY KEY,
        "authorId" INTEGER REFERENCES users(id) NOT NULL, 
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        active BOOLEAN DEFAULT true
        );
        `);
         //console.log("Finished building tables!")       
         await client.query(`
         CREATE TABLE tags(
         id SERIAL PRIMARY KEY,
         name VARCHAR(255) UNIQUE NOT NULL
         );
         `);

         await client.query(`
         CREATE TABLE post_tags(
         "postId" INTEGER REFERENCES posts(id),
         "tagId" INTEGER REFERENCES tags(id), 
         UNIQUE ("postId", "tagId")
         );
         `);

    } catch (error) {
        //console.error("Error building tables!")
      throw error; // we pass the error up to the function that calls createTables
    }
  }
  
  async function createInitialTags() {
    try {
      console.log("Starting to create tags...");
  
      const [happy, sad, inspo, catman] = await createTags([
        '#happy', 
        '#worst-day-ever', 
        '#youcandoanything',
        '#catmandoeverything'
      ]);
  
      const [postOne, postTwo, postThree] = await getAllPosts();
  
      await addTagsToPost(postOne.id, [happy, inspo]);
      await addTagsToPost(postTwo.id, [sad, inspo]);
      // await addTagsToPost(postThree.id, [happy, catman, inspo]);
  
      console.log("Finished creating tags!");
    } catch (error) {
      console.log("Error creating tags!");
      throw error;
    }
  }
  

  async function rebuildDB() {
    try {
      client.connect();
  
      await dropTables();
      await createTables();
      await createInitialUsers();
      await createInitialPosts();
      // await createInitialTags();
    } catch (error) {
      throw error;
    }
  }
  



async function testDB() { //async always must await & contain try/catch
  try {
    // connect the client to the database, finally
    console.log("Starting test database...");

    console.log("Calling getAllUsers")
    // queries are promises, so we must await them
    const users = await getAllUsers();
    console.log("Result: ", users)
    // console.log("getAllUsers:", users);

    console.log("Calling updateUser on users[0]")
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY"
    });
    console.log("Result:", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content"
    });
    console.log("Result:", updatePostResult);

    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);

    console.log("Calling updatePost on posts[1], only updating tags");

    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"]
    });
    console.log("Result:", updatePostTagsResult);

    console.log("Calling getPostsByTagName with #redfish");
    const postsWithRedfish = await getPostsByTagName("#redfish");
    console.log("Result:", postsWithRedfish);

    // for now, logging is a fine way to see what's up
    console.log("Finished database test!");
  } catch (error) {
    console.error("Error testing database!");
    throw error;
  }
}

rebuildDB()
.then(testDB)
.catch(console.error)
.finally(() => client.end);// it's important to close out the client connection