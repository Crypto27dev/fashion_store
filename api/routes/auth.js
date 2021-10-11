const router = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const User = require("../models/User.model")

router.post("/register", async (req, res) => {
	const { fullname, email, password } = req.body

	if (!fullname || !email || !password) {
		return res.status(400).json(authResponse.missingField)
	}

	try {
		const passwordHash = await bcrypt.hash(password, 10)
		await User.create({ 
			fullname, 
			email, 
			password: passwordHash 
		})
		res.status(201).json(authResponse.userCreated)

	} catch (err) {
		console.error(err)
		res.status(500).json(authResponse.unexpectedError)
	}
})

router.post("/login", async (req, res) => {
	const { email, password } = req.body

	if (!email || !password) {
		return res.status(400).json(authResponse.missingField)
	}

	const user = await User.findOne({ email })
	if (!user) {
		return res.status(401).json(authResponse.loginFailed)
	}

	const isValidLogin = await bcrypt.compare(password, user.password)
	if (isValidLogin) {
		const jwtToken = jwt.sign(
			{
				uid: user._id,
				isAdmin: user.isAdmin,
			}, 
			process.env.JWT_SECRET,
			{expiresIn: "3d"},
		)

		return res.json({ 
			...authResponse.loginSuccess,
			accessToken: jwtToken,
		})
	} else {
		return res.status(401).json(authResponse.loginFailed)
	}
})

const authResponse = {
	userCreated: { 
		status: "ok",
		message: "user created",
	},
	loginSuccess: {
		status: "ok",
		message: "login successful",
	},
	missingField: {
		status: "error",
		message: "a required field is missing",
	},
	loginFailed: {
		status: "error",
		message: "incorrect email or password",
	},
	unexpectedError: {
		status: "error",
		message: "an unexpected error occurred",
	},
}

module.exports = router