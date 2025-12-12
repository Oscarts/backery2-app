import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

// Mock Prisma client
const mockPrismaClient = {
  client: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  role: {
    findFirst: jest.fn(),
  },
};

// Mock the entire module to prevent actual database connections
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
}));

// Mock the seed utility to prevent it from running
jest.mock('../../utils/seedDefaultClientData', () => ({
  seedDefaultClientData: jest.fn(),
  ensureCommonUnits: jest.fn(),
}));

// Import after mocking
import { createAdminUser } from '../clientController';

describe('Client Controller - createAdminUser', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockNext = jest.fn();
  });

  describe('Validation', () => {
    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        // Missing password, firstName, lastName, clientId
      };

      await createAdminUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'All fields are required',
      });
    });

    it('should return 404 if client not found', async () => {
      mockRequest.body = {
        email: 'newadmin@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        clientId: 'non-existent-client',
      };

      mockPrismaClient.client.findUnique.mockResolvedValue(null);

      await createAdminUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Client not found',
      });
    });

    it('should return 400 if email already exists', async () => {
      mockRequest.body = {
        email: 'existing@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        clientId: 'client-123',
      };

      mockPrismaClient.client.findUnique.mockResolvedValue({
        id: 'client-123',
        name: 'Test Bakery',
      });

      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@test.com',
      });

      await createAdminUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'A user with this email already exists',
      });
    });
  });

  describe('Role Lookup - Admin vs Organization Admin', () => {
    const setupValidRequest = () => {
      mockRequest.body = {
        email: 'newadmin@bakery.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        clientId: 'client-123',
      };

      mockPrismaClient.client.findUnique.mockResolvedValue({
        id: 'client-123',
        name: 'Test Bakery',
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(null);
    };

    it('should find "Admin" role if it exists', async () => {
      setupValidRequest();

      const adminRole = {
        id: 'role-admin',
        name: 'Admin',
        clientId: 'client-123',
      };

      mockPrismaClient.role.findFirst.mockResolvedValue(adminRole);
      mockPrismaClient.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'newadmin@bakery.com',
        firstName: 'New',
        lastName: 'Admin',
        roleId: 'role-admin',
        clientId: 'client-123',
        isActive: true,
        customRole: adminRole,
      });

      await createAdminUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify role lookup uses OR condition for both Admin and Organization Admin
      expect(mockPrismaClient.role.findFirst).toHaveBeenCalledWith({
        where: {
          clientId: 'client-123',
          OR: [
            { name: 'Admin' },
            { name: 'Organization Admin' },
          ],
        },
      });

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should find "Organization Admin" role for legacy clients', async () => {
      setupValidRequest();

      const orgAdminRole = {
        id: 'role-org-admin',
        name: 'Organization Admin',
        clientId: 'client-123',
      };

      mockPrismaClient.role.findFirst.mockResolvedValue(orgAdminRole);
      mockPrismaClient.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'newadmin@bakery.com',
        firstName: 'New',
        lastName: 'Admin',
        roleId: 'role-org-admin',
        clientId: 'client-123',
        isActive: true,
        customRole: orgAdminRole,
      });

      await createAdminUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Admin user created successfully',
        })
      );
    });

    it('should return 404 if neither Admin nor Organization Admin role exists', async () => {
      setupValidRequest();

      mockPrismaClient.role.findFirst.mockResolvedValue(null);

      await createAdminUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Admin role not found for this client. Please ensure the client has an "Admin" or "Organization Admin" role.',
      });
    });
  });

  describe('User Creation', () => {
    it('should create user with hashed password', async () => {
      mockRequest.body = {
        email: 'newadmin@bakery.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        clientId: 'client-123',
      };

      mockPrismaClient.client.findUnique.mockResolvedValue({
        id: 'client-123',
        name: 'Test Bakery',
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const adminRole = {
        id: 'role-admin',
        name: 'Admin',
      };

      mockPrismaClient.role.findFirst.mockResolvedValue(adminRole);
      mockPrismaClient.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'newadmin@bakery.com',
        firstName: 'New',
        lastName: 'Admin',
        roleId: 'role-admin',
        clientId: 'client-123',
        isActive: true,
        customRole: adminRole,
      });

      await createAdminUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);

      // Verify user was created with correct data
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newadmin@bakery.com',
          passwordHash: 'hashed-password',
          firstName: 'New',
          lastName: 'Admin',
          clientId: 'client-123',
          roleId: 'role-admin',
          isActive: true,
        },
        include: {
          customRole: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'new-user-id',
          email: 'newadmin@bakery.com',
        }),
        message: 'Admin user created successfully',
      });
    });

    it('should lowercase the email before saving', async () => {
      mockRequest.body = {
        email: 'NewAdmin@BAKERY.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        clientId: 'client-123',
      };

      mockPrismaClient.client.findUnique.mockResolvedValue({
        id: 'client-123',
        name: 'Test Bakery',
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.findFirst.mockResolvedValue({
        id: 'role-admin',
        name: 'Admin',
      });
      mockPrismaClient.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'newadmin@bakery.com',
        firstName: 'New',
        lastName: 'Admin',
        roleId: 'role-admin',
        clientId: 'client-123',
        isActive: true,
      });

      await createAdminUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrismaClient.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'newadmin@bakery.com',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should call next with error on unexpected exception', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        clientId: 'client-123',
      };

      const dbError = new Error('Database connection failed');
      mockPrismaClient.client.findUnique.mockRejectedValue(dbError);

      await createAdminUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });
});
