import { Request, Response, NextFunction } from 'express';
import { login } from '../authController';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../app', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('../../middleware/auth', () => ({
    generateToken: jest.fn(() => 'mock-jwt-token'),
}));

describe('Auth Controller - Login', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        // Clear global client context before each test
        (global as any).__currentClientId = undefined;

        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        mockRequest = {
            body: {},
            ip: '127.0.0.1',
        };

        mockResponse = {
            json: jsonMock,
            status: statusMock,
        };

        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Login without client context (unauthenticated)', () => {
        it('should successfully login when __currentClientId is undefined', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'admin@abcbakery.com',
                passwordHash: await bcrypt.hash('password123', 10),
                clientId: 'client-abc',
                roleId: 'role-admin',
                firstName: 'Admin',
                lastName: 'User',
                role: 'ADMIN',
                isActive: true,
                client: {
                    id: 'client-abc',
                    name: 'ABC Bakery',
                    slug: 'abc-bakery',
                    isActive: true,
                },
                customRole: {
                    id: 'role-1',
                    name: 'Admin',
                    description: 'Full access',
                    permissions: [],
                },
            };

            mockRequest.body = {
                email: 'admin@abcbakery.com',
                password: 'password123',
            };

            const { prisma } = require('../../app');
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.user.update.mockResolvedValue(mockUser);

            // Ensure no client context is set (simulating login)
            expect((global as any).__currentClientId).toBeUndefined();

            await login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Should successfully find user and return token
            expect(prisma.user.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { email: 'admin@abcbakery.com' },
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        token: expect.any(String),
                        user: expect.objectContaining({
                            email: 'admin@abcbakery.com',
                        }),
                    }),
                })
            );
        });

        it('should handle user not found gracefully', async () => {
            mockRequest.body = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            const { prisma } = require('../../app');
            prisma.user.findUnique.mockResolvedValue(null);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid email or password',
                })
            );
        });

        it('should reject inactive user', async () => {
            const inactiveUser = {
                id: 'user-123',
                email: 'inactive@example.com',
                isActive: false,
                client: { isActive: true },
            };

            mockRequest.body = {
                email: 'inactive@example.com',
                password: 'password123',
            };

            const { prisma } = require('../../app');
            prisma.user.findUnique.mockResolvedValue(inactiveUser);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Account is inactive',
                })
            );
        });

        it('should reject user from inactive client', async () => {
            const userWithInactiveClient = {
                id: 'user-123',
                email: 'user@example.com',
                isActive: true,
                client: { isActive: false, name: 'Inactive Client' },
            };

            mockRequest.body = {
                email: 'user@example.com',
                password: 'password123',
            };

            const { prisma } = require('../../app');
            prisma.user.findUnique.mockResolvedValue(userWithInactiveClient);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Organization account is inactive',
                })
            );
        });
    });
});
