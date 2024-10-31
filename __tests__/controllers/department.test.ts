import request from 'supertest';
import app from '../../index';
import { Request } from 'express';
import { DepartmentController } from '../../controllers/department';
const departmentController = new DepartmentController();
import { DepartmentBody } from '../../types/department';
import { DepartmentService } from '../../service/department';
const departmentService = new DepartmentService();


describe('List department', () => {
    it('responds with status 200 and department list', async () => {
        const response = await request(app).get('/mass-com/list-department');
        expect(response.status).toBe(200);
    });
});

describe('Create department', () => {
    it('creates a new department with valid data', async () => {
        const departmentData: any = { name: "test" };
        const response = await request(app)
            .post('/mass-com/create-department')
            .send(departmentData);
        expect(response.status).toBe(200);
    });

    it('responds with an error when name is not provided', async () => {
        const dataWithoutName = {};
        const response = await request(app)
            .post('/mass-com/create-department')
            .send(dataWithoutName);

        return response.body
    });

    it('responds with an error when name is a number', async () => {
        const dataWithInvalidName = { name: 123 };
        const response = await request(app)
            .post('/mass-com/create-department')
            .send(dataWithInvalidName);
        return response.body
    });


    it('should handle errors and respond with status 400', async () => {
        // Mock the departmentService.createDepartment method to throw an error
        jest.spyOn(departmentService, 'createDepartment').mockRejectedValue(new Error('Test error'));

        // Mock request and response objects
        const req = {
            body: {
                // Provide valid request body data here
                name: 'Valid department name', // Example data
            },
        } as Request<{}, {}, DepartmentBody>;


        const mockResponse: any = {
            json: jest.fn(),
            status: jest.fn(),
        };

        // Call the controller method
        await departmentController.createDepartment(req, mockResponse);

        // Verify that the response status was set to 400
        expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
});


describe('Update department', () => {
    it('updates a department with valid data', async () => {
        const departmentData: any = { id: "661fbaec77cc4a1326cc1989", name: "test" };
        const response = await request(app)
            .post('/mass-com/update-department')
            .send(departmentData); return response.body
    });

    it('responds with an error when id is not provided', async () => {
        const dataWithoutId = { name: "test" }; // Missing id
        const response = await request(app)
            .post('/mass-com/update-department')
            .send(dataWithoutId); return response.body
    });

    it('responds with an error when name is not provided', async () => {
        const dataWithoutName = { id: "661fbaec77cc4a1326cc1989" }; // Missing name
        const response = await request(app)
            .post('/mass-com/update-department')
            .send(dataWithoutName); return response.body
    });

    it('responds with an error when name is a number', async () => {
        const dataWithInvalidName = { id: "661fbaec77cc4a1326cc1989", name: 123 }; // Invalid name
        const response = await request(app)
            .post('/mass-com/update-department')
            .send(dataWithInvalidName); return response.body
    });
});


describe('Delete department', () => {
    it('deletes a department with valid data', async () => {
        const departmentData: any = { id: "661fbaec77cc4a1326cc1989" };
        const response = await request(app)
            .post('/mass-com/delete-department')
            .send(departmentData);
        expect(response.status).toBe(200);
    });

    it('responds with an error when id is not provided', async () => {
        const dataWithoutId = {}; // Missing id
        const response = await request(app)
            .post('/mass-com/delete-department')
            .send(dataWithoutId); return response.body
    });

    it('responds with an error when id is invalid', async () => {
        const dataWithInvalidId = { id: "invalid_id_here" }; // Invalid id
        const response = await request(app)
            .post('/mass-com/delete-department')
            .send(dataWithInvalidId); return response.body
    });
});