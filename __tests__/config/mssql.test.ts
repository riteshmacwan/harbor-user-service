import { connectMssqlDb } from '../../config/mssql';
let server: string|undefined = process.env.NODE_ENV;

describe('connectMssqlDb', () => {
    it("Connection to MSSQL DB", async () => {
        let res = await connectMssqlDb()
        expect(res).toHaveProperty('Sequelize');
        expect(res).toHaveProperty('sequelize');

        const { Sequelize, sequelize } = res;
        expect(Sequelize).toBeDefined();
        expect(sequelize).toBeDefined();
    }, 45000)
});
describe('connectMssqlDb', () => {
  
    it('should throw an error if required environment variables are missing', async () => {
      // Mock the commonUtils.getSecret method to return undefined for all keys
      const mockCommonUtils = {
        getSecret: jest.fn().mockReturnValue(undefined),
      };

      // Inject the mock commonUtils into the function
      jest.mock('../../utils', () => ({
        CommonUtils: jest.fn(() => mockCommonUtils),
      }));

      delete process.env.NODE_ENV;

      // Call the connectMssqlDb function and expect it to throw an error
      await expect(connectMssqlDb()).rejects.toThrow('Missing required environment variables for MSSQL connection');
    });
    
    it('should connect to MSSQL database and return Sequelize and sequelize instances', async () => {
      // Mock the commonUtils.getSecret method to return mock environment variables
      const mockCommonUtils = {
        getSecret: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'test-MSSQL-HOST':
              return 'mocked_host';
            case 'test-MSSQL-DB':
              return 'mocked_db';
            case 'test-MSSQL-USERNAME':
              return 'mocked_username';
            case 'test-MSSQL-PASSWORD':
              return 'mocked_password';
            case 'test-MSSQL-PORT':
              return '5432';
            default:
              throw new Error('Unknown key');
          }
        }),
      };
  
      // Inject the mock commonUtils into the function
      jest.mock('../../utils', () => ({
        CommonUtils: jest.fn(() => mockCommonUtils),
      }));
  
      process.env.NODE_ENV = server;

      // Call the connectMssqlDb function
      const db = await connectMssqlDb();
  
      // Check if Sequelize and sequelize instances are returned
      expect(db).toHaveProperty('Sequelize');
      expect(db).toHaveProperty('sequelize');
    });
  });