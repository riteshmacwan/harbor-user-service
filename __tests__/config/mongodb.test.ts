import mongoose from "mongoose";
import { connectMongoDb, disconnectDB, generateMongoDbUrl } from '../../config/mongodb';

describe('MongoDB Connection', () => {
    it("Get the mongodb url", async () => {
        await generateMongoDbUrl()
    })
});

describe('connectMongoDb', () => {
    it('should connect to MongoDB memory server in test environment', async () => {
        await connectMongoDb();
    });

    it('should handle connection error', async () => {
        jest.spyOn(mongoose, "connect").mockRejectedValueOnce(new Error("Connection error"));
        jest.spyOn(console, "error").mockImplementationOnce(() => { });
        await connectMongoDb();
    });
});


describe('disconnectDB function', () => {
    it('should handle errors during disconnection', async () => {
        mongoose.disconnect = jest.fn().mockRejectedValue(new Error('Error disconnecting from the database'));
        try {
            await disconnectDB();
        } catch (error: any) {
            // Expectations related to the error handling can be placed here
            expect(error.message).toBe('Error disconnecting from the database');
        }
    });
});