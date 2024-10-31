import { CommonUtils } from '../../utils/common';

// Mocking Azure Key Vault and ioredis
const { SecretClient } = jest.requireActual('@azure/keyvault-secrets');
jest.mock('ioredis', () => {
  const mockRedis = require('ioredis-mock');
  return {
    __esModule: true,
    default: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn()
    })),
    ...mockRedis
  };
});

// Mocking SecretClient from @azure/keyvault-secrets
jest.mock('@azure/keyvault-secrets', () => {
  return {
    __esModule: true,
    SecretClient: jest.fn(() => ({
      getSecret: jest.fn()
    }))
  };
});

describe('CommonUtils', () => {
  let utils: CommonUtils;

  beforeEach(() => {
    utils = CommonUtils.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setCache', () => {
    it('should set data in cache', async () => {
      // Mocking Redis client
      utils['redisClient'] = {
        set: jest.fn().mockResolvedValueOnce('OK')
      };

      await utils.setCache('testKey', { key: 'value' }, 30);
      expect(utils['redisClient'].set).toHaveBeenCalledWith('testKey', JSON.stringify({ key: 'value' }), 'EX', 30);
    });

    it('should handle errors in setCache', async () => {
      // Mocking Redis client to throw an error
      utils['redisClient'] = {
        set: jest.fn().mockRejectedValueOnce(new Error('Failed to set cache'))
      };

      await expect(utils.setCache('testKey', { key: 'value' }, 30)).rejects.toThrow('Failed to set cache');
    });
  });

  describe('getCache', () => {


    it('should get data from cache', async () => {
      // Mocking Redis client
      utils['redisClient'] = {
        get: jest.fn().mockResolvedValueOnce(JSON.stringify({ key: 'value' }))
      };

      const cachedData = await utils.getCache('testKey');
      expect(cachedData).toEqual({ key: 'value' });
    });

    it('should handle errors in getCache', async () => {
      // Mocking Redis client to throw an error
      utils['redisClient'] = {
        get: jest.fn().mockRejectedValueOnce(new Error('Failed to get cache'))
      };
      const cachedData = await utils.getCache('testKey');
      expect(cachedData).toBeNull();
    });
  });

  describe('getSecret', () => {
    it('should get secret from cache if available', async () => {
      // Mocking getCache method to return cached secret
      utils.getCache = jest.fn().mockResolvedValueOnce('cached-secret');

      const secret = await utils.getSecret('test-secret');
      expect(secret).toEqual('cached-secret');
    });

    it('should handle errors in getSecret', async () => {
      // Mocking getCache method to throw an error
      utils.getCache = jest.fn().mockRejectedValueOnce(new Error('Failed to get cache'));

      const secret = await utils.getSecret('test-secret');
      expect(secret).toBeNull();
    });
  });

  describe('pagination', () => {
    it('should calculate pagination correctly', async () => {
      const pagination = await utils.pagination(100, 1, 10);
      expect(pagination).toEqual({
        totalCount: 100,
        pageSize: 10,
        totalPage: 10,
        currentPage: 1,
        isMore: false
      });
    });
  });

  describe('getSenderEmail', () => {
    it('should retrieve sender emails', async () => {
      await utils.getSenderEmail();
    });
  });
});
