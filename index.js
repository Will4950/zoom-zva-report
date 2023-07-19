/* eslint-disable-next-line no-unused-vars */
import dotenv from 'dotenv/config';
import logger from './logger.js';
import axios from 'axios';
import express from 'express';
import open from 'open';

if (!process.env.clientID) {
	logger.error('clientID missing in .env');
	process.exit(1);
}

if (!process.env.clientSecret) {
	logger.error('clientSecret missing in .env');
	process.exit(1);
}

if (!process.env.kbId) {
	logger.error('kbId missing in .env');
	process.exit(1);
}

const kbId = process.env.kbId;
const port = process.env.PORT || 3000;
const uri = `http://localhost:${port}/oauth`;
const zoomAPI = 'https://api.zoom.us/v2/';
const tokenHost = 'https://zoom.us/oauth/';
const userAuth = `${tokenHost}authorize?response_type=code&client_id=${process.env.clientID}&redirect_uri=${uri}`;
const userStorage = new Object();

const app = express();
app.set('query parser', 'simple');

app.get('/oauth', express.json(), async function oAuthHandler(req, res) {
	let oauthToken = Buffer.from(
		`${process.env.clientID}:${process.env.clientSecret}`
	).toString('base64');

	try {
		let getToken = await axios({
			method: 'post',
			url: `${tokenHost}token?code=${req.query.code}&grant_type=authorization_code&redirect_uri=${uri}`,
			headers: {Authorization: `Basic ${oauthToken}`}
		});
		userStorage.access_token = getToken.data.access_token;
	} catch (e) {
		res.status(200).json({status: 'Error.  Could not get user token.'});
		return;
	}

	try {
		let getArticles = await axios({
			method: 'get',
			url: `${zoomAPI}/km/kbs/${kbId}/articles`,
			headers: {
				Authorization: `Bearer ${userStorage.access_token}`,
				'Content-Type': 'application/json'
			}
		});
		res.status(200).json(getArticles.data);
	} catch (e) {
		res.status(200).json({status: 'Error', data: 'no data'});
		return;
	}
});

app.listen(port, async function startServer() {
	logger.info(`listening on port ${port}`);
	await open(userAuth);
});
