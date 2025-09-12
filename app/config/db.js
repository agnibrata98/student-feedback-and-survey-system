const mongoose = require("mongoose");

class DbConnect {
    async connectDb() {
        try {
            mongoose.connect(process.env.DB_URI);
            console.log("DB Connected");
            
        }catch(err) {
            throw err;
        }
    }
}

module.exports = new DbConnect();