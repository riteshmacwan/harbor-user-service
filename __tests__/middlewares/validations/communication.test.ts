import { communicationCreate, validation } from '../../../middlewares/validations/communication';
import express from 'express';
import request from 'supertest';

describe('Communication Validation', () => {
    let app;

    beforeAll(() => {
        // Assuming you have an Express app setup
        app = express();
        app.use(express.json());
        app.use(validation);
        app.post('/communication', communicationCreate, (req, res) => {
            res.status(200).json({ message: 'Communication created successfully' });
        });
    });

    describe('communicationCreate', () => {
        it('should validate communication fields', async () => {
            const testData = [
                { title: '', type: 'sms', department_id: 1, description: 'test', status: 'draft', referral_source: 'test', study: 'test' },
                { title: 'test', type: 'phone', department_id: 1, description: 'test', status: 'pending_review', referral_source: 'test', study: 'test' },
                { title: 'test', type: 'sms', department_id: 0, description: 'test', status: 'pending_review', referral_source: 'test', study: 'test' },
                { title: 'test', type: 'sms', department_id: 1, description: 'a'.repeat(501), status: 'pending_review', referral_source: 'test', study: 'test' },
                { title: 'test', type: 'sms', department_id: 1, description: 'test', status: 'sent', referral_source: 'test', study: 'test' },
                { title: 'test', type: 'sms', department_id: 1, description: 'test', status: 'pending_review', referral_source: 'test' },
                { title: 'test', type: 'sms', department_id: 1, description: 'test', status: 'pending_review', study: 'test' }
            ];

            for (const data of testData) {
                const response = await request(app)
                    .post('/communication')
                    .send(data);

                expect(response.statusCode).toBe(200);
            }
        });
    });
});
