import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { setupSwagger } from './swagger.config';
import { initDB } from './database.config';
import { Profile, User } from './user.model';
import { generateShardId, getSequelizeInstanceForId } from './shard.config';
import { initDB2 } from './database2.config';
import { initDB3 } from './database3.config';

//#region App Setup
const app = express();

dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));
setupSwagger(app, BASE_URL);

//#endregion App Setup

//#region Code here
app.get('/shard/:str', async (req: Request, res: Response) => {
  // Example usage
  let result = generateShardId(req.params.str);
  return res.status(200).send({ result });
});

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create a new user
 *     description: Adds a new user to the database.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: securepassword
 *               bio:
 *                 type: string
 *                 example: This is a sample bio
 *               avatarURL:
 *                 type: string
 *                 example: http://awesome.com/image.jpg
 *     responses:
 *       201:
 *         description: User created successfully
 *       500:
 *         description: Internal server error
 */
app.post('/user', async (req: Request, res: Response) => {
  try {
    const { username, email, password, bio, avatarURL } = req.body;

    const shardId = generateShardId(email); // Generate or retrieve the user ID
    console.log(email, shardId);

    // Get the correct shard
    const sequelize = getSequelizeInstanceForId(shardId);

    const profile = await sequelize.Profile.create({ shardId, bio, avatarURL });
    const user = await sequelize.User.create({
      shardId,
      username,
      email,
      password,
      profileId: profile.id,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users from the database.
 *     tags: [User]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 */
app.get('/user', async (req: Request, res: Response) => {
  try {
    // Assuming you have a function to get all shard instances
    const shardIds = [1, 2, 3]; // An array of shard IDs, e.g., [1, 2, 3, ...]

    const userPromises = shardIds.map(async (shardId) => {
      const sequelize = getSequelizeInstanceForId(shardId);
      // Fetch users along with their profile from this shard
      return sequelize.User.findAll({ include: sequelize.Profile });
    });

    // Wait for all promises to resolve (users fetched from all shards)
    const usersFromAllShards = await Promise.all(userPromises);

    // Flatten the array of arrays into a single array of users
    const allUsers = usersFromAllShards.flat();

    return res.json({
      success: true,
      message: 'Users fetched successfully from all shards',
      data: allUsers,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /user/{email}:
 *   get:
 *     summary: Get user by email
 *     description: Retrieves a user by their ID.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User email
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 avatarURL:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
app.get('/user/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const shardId = generateShardId(email); // Function to determine shard based on ID
    const sequelize = getSequelizeInstanceForId(shardId);

    const user = await sequelize.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /user/{email}:
 *   put:
 *     summary: Update a user by email
 *     description: Update an existing user's details.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 example: newpassword
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
app.put('/user/:email', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const email = req.params.email;

    // Assuming a function to find the shard ID based on the user ID
    const shardId = generateShardId(email);

    // Get the correct shard
    const sequelize = getSequelizeInstanceForId(shardId);

    // Find the user in the correct shard
    const user = await sequelize.User.findOne({ where: { email } });

    if (user) {
      // Update user details
      user.username = username;
      user.email = email;
      user.password = password;
      await user.save();

      return res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /user/{email}:
 *   delete:
 *     summary: Delete a user by email
 *     description: Remove a user from the database by their unique email.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
app.delete('/user/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email;

    // Assuming a function to find the shard ID based on the user ID
    const shardId = generateShardId(email);
    const sequelize = getSequelizeInstanceForId(shardId);

    const user = await sequelize.User.findOne({ where: { email } });
    if (user) {
      await user.destroy();
      return res.status(204).send();
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

//#endregion

//#region Server Setup

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Call a demo external API (httpbin.org)
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/api', async (req: Request, res: Response) => {
  try {
    const result = await axios.get('https://httpbin.org');
    return res.send({
      message: 'Demo API called (httpbin.org)',
      data: result.status,
    });
  } catch (error: any) {
    console.error('Error calling external API:', error.message);
    return res.status(500).send({ error: 'Failed to call external API' });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health check
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/', (req: Request, res: Response) => {
  return res.send({ message: 'API is Live!' });
});

/**
 * @swagger
 * /obviously/this/route/cant/exist:
 *   get:
 *     summary: API 404 Response
 *     description: Returns a non-crashing result when you try to run a route that doesn't exist
 *     tags: [Default]
 *     responses:
 *       '404':
 *         description: Route not found
 */
app.use((req: Request, res: Response) => {
  return res
    .status(404)
    .json({ success: false, message: 'API route does not exist' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // throw Error('This is a sample error');
  console.log(`${'\x1b[31m'}`); // start color red
  console.log(`${err.message}`);
  console.log(`${'\x1b][0m]'}`); //stop color

  return res
    .status(500)
    .send({ success: false, status: 500, message: err.message });
});

app.listen(PORT, async () => {
  await initDB();
  await initDB2();
  await initDB3();
  console.log(`Server running on port ${PORT}`);
});

// (for render services) Keep the API awake by pinging it periodically
// setInterval(pingSelf(BASE_URL), 600000);

//#endregion
