import { verifyToken } from '../../middlewares/auth'; // Import the middleware function
import { Response, NextFunction } from 'express';
import { UserRequest } from '../../types/request';

describe('verifyToken middleware', () => {
    let req: UserRequest;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
        req = {} as UserRequest;
        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
        } as unknown as Response;
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if no token is provided', async () => {
        await verifyToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to authenticate token' });
    });

    it('should return 401 if invalid token is provided', async () => {
        req.headers = { authorization: 'InvalidToken' };
        await verifyToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('For original token provides', async () => {
        req.headers = { authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyYWptLmd3QGRtY2xpbmljYWwuY29tIiwianRpIjoiYTg2MDM1OGQtNWY4ZS00YWUzLWFlNTktZmNhOTZlMWY1NWQ4IiwiaWF0IjoxNzE0NzEyNTUyLCJuYW1laWQiOiIxNDQxIiwicm9sIjoiYXBpX2FjY2VzcyIsImlkIjoiMTEyNDIyNDIzNjM3ODYxMTk4MzkyIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiU3VwZXJBZG1pbnMiLCJuYmYiOjE3MTQ3MTI1NTEsImV4cCI6MTcxNDc0ODU1MSwiaXNzIjoiRG1jciIsImF1ZCI6Imh0dHBzOi8vc3RhZ2UuYmUuYXRvbS5kbWNsaW5pY2FsLmNvbSJ9.EmC9oHYAzXc0IsKg1nGityq8eMDgtAryXRePYnihNwU` };
        await verifyToken(req, res, next);
    });
});