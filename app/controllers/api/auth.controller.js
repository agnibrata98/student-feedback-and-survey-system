const StatusCode = require ('../../helper/StatusCode');

class AuthController {
  async getWelcome (req, res) {
    try {
      res.status (StatusCode.OK).json ({message: 'Welcome to the API!'});
    } catch (error) {
      console.error ('Error in getWelcome:', error);
      res
        .status (StatusCode.SERVER_ERROR)
        .json ({error: 'Internal Server Error'});
    }
  }
}

module.exports = new AuthController ();
