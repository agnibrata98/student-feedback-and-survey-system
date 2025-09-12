const bcrypt = require("bcryptjs");


// Hash the password
const hashedPassword = async(password) => {
    // Generate a salt
    const salt = await bcrypt.genSalt(15);
    // Hash the password
    const hashed = await bcrypt.hash(password,salt);
    return hashed;
}

module.exports = hashedPassword;