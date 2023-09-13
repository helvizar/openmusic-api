/* eslint-disable no-underscore-dangle */

const ClientError = require('../../exceptions/ClientError');

class AuthenticationsHandler {
  constructor(AuthenticationsService, UsersService, TokenManager, AuthenticationsValidator) {
    this._authenticationsService = AuthenticationsService;
    this._usersService = UsersService;
    this._tokenManager = TokenManager;
    this._authenticationsValidator = AuthenticationsValidator;
  }

  async postAuthenticationHandler(request, h) {
    try {
      this._authenticationsValidator.validatePostAuthenticationPayload(request.payload);

      const { username, password } = request.payload;
      const id = await this._usersService.verifyUserCredential(username, password);

      const accessToken = this._tokenManager.generateAccessToken({ id });
      const refreshToken = this._tokenManager.generateRefreshToken({ id });

      await this._authenticationsService.addRefreshToken(refreshToken);

      const response = h.response({
        status: 'success',
        message: 'Authentication berhasil ditambahkan',
        data: {
          accessToken,
          refreshToken,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kesalahan pada server kami.',
      });
      response.code(500);
      console.log(error);
      return response;
    }
  }

  async putAuthenticationHandler(request, h) {
    this._authenticationsValidator.validatePutAuthenticationPayload(request.payload);

    const { refreshToken } = request.payload;
    await this._authenticationsService.verifyRefreshToken(refreshToken);

    const { id } = this._tokenManager.verifyRefreshToken(refreshToken);
    const accessToken = this._tokenManager.generateAccessToken({ id });

    return h.response({
      status: 'success',
      message: 'Access Token berhasil diperbarui',
      data: {
        accessToken,
      },
    });
  }

  async deleteAuthenticationHandler(request, h) {
    this._authenticationsValidator.validateDeleteAuthenticationPayload(request.payload);

    const { refreshToken } = request.payload;
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    await this._authenticationsService.deleteRefreshToken(refreshToken);

    return h.response({
      status: 'success',
      message: 'Refresh token berhasil dihapus',
    });
  }
}

module.exports = AuthenticationsHandler;
